import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Appointment, Doctor, Patient } from '@/types/index'; // Importar tipos necessários
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'; // <-- IMPORTAR

// Importar dados JSON para buscar infos adicionais
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';

// Tipos esperados no corpo da requisição do frontend
export interface SuggestSlotsRequestBody {
    patientId: string;
    doctorSequence: string[]; // Array de IDs de médicos na ordem desejada
    priority: 'Mínima' | 'Média' | 'Máxima';
    relevantAppointments: Appointment[]; // <-- RECEBER AGENDAMENTOS RELEVANTES
    // preferredStartDate?: string;
    // preferredEndDate?: string;
}

// Tipo para a estrutura de uma sugestão retornada pela API
// (Esta estrutura pode evoluir conforme a resposta real do Gemini)
export interface SlotSuggestion {
    optionId: number;
    explanation: string;
    recommended: boolean;
    newAppointments: { doctorId: string; start: string; end: string }[]; // Slots sequenciais propostos
    rescheduledAppointments?: { // Agendamentos a serem remanejados (opcional)
        originalAppointmentId: string;
        originalPatientId: string;
        originalDoctorId: string;
        newSuggestedStart: string;
        newSuggestedEnd: string;
    }[];
}

// --- Inicialização do Cliente Gemini --- 
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error('Erro: Chave de API do Google não encontrada nas variáveis de ambiente (GOOGLE_API_KEY).');
    // Em um ambiente real, talvez lançar um erro ou ter um status de health check
}

const genAI = new GoogleGenerativeAI(API_KEY || ''); // Passa a chave ou string vazia se não encontrada

// Configurações de segurança (ajustar conforme necessário)
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
// ----------------------------------------

// --- Funções auxiliares de data (REMOVER as não usadas) --- 
// REMOVER dayNameToNumber
// REMOVER findDateForDayOfWeek

// MANTER getISODateString e getCurrentTimeHHMM (podem ser úteis)
function getISODateString(date: Date): string {
    return date.toISOString().split('T')[0];
}
function getCurrentTimeHHMM(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
// -----------------------------------------------------

// --- Nova Função Auxiliar para Checar Sobreposição --- 
function doIntervalsOverlap(
    start1Str: string | null | undefined,
    end1Str: string | null | undefined,
    start2Str: string | null | undefined,
    end2Str: string | null | undefined
): boolean {
    if (!start1Str || !end1Str || !start2Str || !end2Str) return false; // Não sobrepõe se algum for inválido
    try {
        const start1 = new Date(start1Str).getTime();
        const end1 = new Date(end1Str).getTime();
        const start2 = new Date(start2Str).getTime();
        const end2 = new Date(end2Str).getTime();

        if (isNaN(start1) || isNaN(end1) || isNaN(start2) || isNaN(end2)) return false; // Datas inválidas

        // Verifica se um intervalo começa antes do outro terminar E termina depois do outro começar
        // Adiciona pequena margem (1ms) para evitar problemas com horários colados (ex: termina 09:00, começa 09:00)
        return start1 < end2 - 1 && end1 > start2 + 1;
    } catch {
        return false; // Erro no parse, assume não sobrepõe
    }
}
// -----------------------------------------------------

export async function POST(request: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'Configuração inválida do servidor: Chave de API ausente.' }, { status: 500 });
    }

    try {
        const body: SuggestSlotsRequestBody = await request.json();
        const { patientId, doctorSequence, priority, relevantAppointments } = body;

        // Validação Básica
        if (!patientId || !doctorSequence || doctorSequence.length === 0 || !priority || !relevantAppointments) { 
            return NextResponse.json({ error: 'Dados incompletos na requisição.' }, { status: 400 });
        }

        console.log('API Recebeu Pedido de Sugestão com:');
        console.log(` - Paciente: ${patientId}, Prioridade: ${priority}`);
        console.log(` - Sequência Médicos: ${doctorSequence.join(', ')}`);
        console.log(` - ${relevantAppointments.length} Agendamentos Relevantes Recebidos`);

        // --- Calcular Janela de Tempo E Hora Atual ---
        const windowStartDate = new Date();
        const windowEndDate = new Date();
        windowEndDate.setDate(windowStartDate.getDate() + 3); 
        const startDateISO = getISODateString(windowStartDate);
        const endDateISO = getISODateString(windowEndDate);     
        const currentTime = getCurrentTimeHHMM(); // <-- Pegar hora atual
        console.log(`Janela: ${startDateISO} a ${endDateISO}. Hora atual: ${currentTime}`);
        // --------------------------------------------

        // --- Buscar Dados Adicionais (JSONs Locais) ---
        const doctorsWorkingHours: { [doctorId: string]: any } = {};
        const doctorDetails: { [doctorId: string]: { name: string, workingHours?: any } } = {};
        doctorSequence.forEach(docId => {
            const doctor = (doctorsData as Doctor[]).find(d => d.id === docId);
            if (doctor) {
                doctorDetails[docId] = { name: doctor.name, workingHours: doctor.workingHours };
                if (doctor.workingHours) {
                    doctorsWorkingHours[docId] = doctor.workingHours;
                }
            }
        });

        const patientIdsInvolved = new Set<string>([patientId, ...relevantAppointments.map(app => app.patientId)]);
        const patientDetails: { [patientId: string]: string } = {};
        patientIdsInvolved.forEach(pId => {
            const patient = (patientsData as Patient[]).find(p => p.id === pId);
            if (patient) {
                patientDetails[pId] = patient.name;
            }
        });
        console.log("Dados Adicionais Coletados:", { doctorsWorkingHours, patientDetails });

        // --- Construir Objeto do Prompt (adicionar hora atual) --- 
        const promptObject = {
            task: "Sugira 3 opções de agendamento estritamente sequencial e no mesmo dia para uma clínica.",
            currentTime: currentTime, // <-- INCLUIR HORA ATUAL
            newRequest: { 
                patientId: patientId,
                patientName: patientDetails[patientId] || 'Desconhecido',
                doctorSequence: doctorSequence.map(id => ({ id, name: doctorDetails[id]?.name || 'Desconhecido' })),
                priority: priority
            },
            currentScheduleContext: relevantAppointments.map(app => ({ 
                appointmentId: app.id,
                start: app.start,
                end: app.end,
                doctorId: app.doctorId,
                patientId: app.patientId,
                patientName: patientDetails[app.patientId] || 'Desconhecido',
                priority: app.priority || 'Média'
            })),
            doctorWorkingHours: doctorsWorkingHours,
            detailedInstructions: {
                coreLogic: [
                    "O objetivo principal é encontrar 3 opções onde o paciente solicitado possa ser atendido pelos médicos na sequência EXATA fornecida.",
                    "IMPORTANTE: Todos os atendimentos da sequência DEVEM ocorrer no MESMO DIA.",
                    `JANELA DE TEMPO: As opções devem estar entre ${startDateISO} e ${endDateISO}.`,
                    `REGRA DA HORA ATUAL: Para sugestões no dia de HOJE (${startDateISO}), o horário de início do PRIMEIRO atendimento da sequência deve ser POSTERIOR às ${currentTime}. Para os dias seguintes (${startDateISO !== endDateISO ? getISODateString(new Date(windowStartDate.setDate(windowStartDate.getDate() + 1))) : 'N/A'} a ${endDateISO}), qualquer horário dentro do expediente é válido.`,
                    // --- REFORÇAR REGRA ANTI-CONFLITO --- 
                    "VERIFICAÇÃO DE CONFLITO CRÍTICA: Antes de sugerir um horário para um médico em 'newAppointments', verifique se esse médico JÁ NÃO POSSUI um agendamento em 'currentScheduleContext' que se sobreponha TOTAL ou PARCIALMENTE a esse horário. As sugestões NÃO PODEM criar dupla reserva.",
                    // -------------------------------------
                    "INTERVALO MÍNIMO: O intervalo entre consultas na sequência deve ser mínimo (idealmente 0 min). Duração padrão: 45 min.",
                    "RESPEITAR HORÁRIO DE TRABALHO: Os horários DEVEM respeitar o expediente de cada médico.",
                    "IGNORAR SELEÇÃO MANUAL: Baseie-se apenas nas regras e disponibilidade."
                ],
                priorityRules: { /* ... */ },
                suggestionProcess: [ /* ... */ ],
                outputFormatPerOption: { /* ... */ },
                finalFormat: "Retorne a resposta ESTRITAMENTE como um objeto JSON..."
            }
        };
        // --- Fim da construção do Prompt ---

        const promptString = JSON.stringify(promptObject, null, 2);
        console.log("--- PROMPT JSON COM HORA ATUAL ---");
        console.log(promptString);
        console.log("------------------------------------");

        // --- Chamar a API Gemini --- 
        console.log("Iniciando chamada à API Gemini...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings }); 
        const result = await model.generateContent(promptString);
        const response = result.response;
        const text = response.text();
        console.log("Resposta Bruta Gemini Recebida:", text);

        // --- Processamento e VALIDAÇÃO da resposta --- 
        let validatedSuggestions: any[] = []; // Sugestões que passaram na validação
        let jsonString = '';
        try {
            jsonString = extractJsonFromString(text);
            if (!jsonString) { throw new Error("A IA não retornou conteúdo analisável."); }
            const jsonResponse = JSON.parse(jsonString);
            
            // Encontra o array de sugestões (flexível)
            let foundSuggestionsArray: any[] | null = null;
            for (const key in jsonResponse) {
                if (Object.prototype.hasOwnProperty.call(jsonResponse, key) && Array.isArray(jsonResponse[key])) {
                    foundSuggestionsArray = jsonResponse[key]; 
                    console.log(`Encontrado array de sugestões na chave: '${key}'`);
                    break; 
                }
            }
            if (foundSuggestionsArray === null) {
                 throw new Error("A IA retornou sugestões em formato inesperado (nenhum array encontrado).");
            }
            
            console.log(`${foundSuggestionsArray.length} sugestões brutas recebidas da IA.`);

            // --- VALIDAÇÃO DE CONFLITOS --- 
            validatedSuggestions = foundSuggestionsArray.filter((suggestion, sugIndex) => {
                const suggestionDate = suggestion.date; // Data da sugestão (YYYY-MM-DD)
                if (!suggestionDate) {
                    console.warn(`Sugestão ${sugIndex + 1} descartada: IA não retornou a data.`);
                    return false; // Descarta sugestão sem data
                }
                
                // Pega o array de agendamentos dentro da sugestão (flexível)
                const appointmentsInSuggestion = suggestion.schedule || suggestion.appointments || suggestion.newAppointments || [];
                if (appointmentsInSuggestion.length === 0) {
                    console.warn(`Sugestão ${sugIndex + 1} descartada: Sem agendamentos internos.`);
                    return false; // Descarta sugestão vazia
                }

                // Verifica CADA agendamento proposto na sugestão
                for (const proposedApp of appointmentsInSuggestion) {
                    const proposedDoctorId = proposedApp.doctorId;
                    // Constrói start/end local (sem Z) para comparação
                    const proposedStart = suggestionDate && proposedApp.startTime ? `${suggestionDate}T${proposedApp.startTime.replace(/(:00)?Z$/, '').padStart(5, '0')}` : null;
                    const proposedEnd = suggestionDate && proposedApp.endTime ? `${suggestionDate}T${proposedApp.endTime.replace(/(:00)?Z$/, '').padStart(5, '0')}` : null;
                    
                    if (!proposedStart || !proposedEnd) {
                         console.warn(`Agendamento proposto inválido na sugestão ${sugIndex + 1} descartado (start/end ausente ou inválido):`, proposedApp);
                         return false; // Descarta sugestão inteira se um app for inválido
                    }

                    // Compara com TODOS os agendamentos existentes relevantes
                    for (const existingApp of relevantAppointments) {
                        if (existingApp.doctorId === proposedDoctorId) {
                            // Checa sobreposição
                            if (doIntervalsOverlap(proposedStart, proposedEnd, existingApp.start, existingApp.end)) {
                                console.warn(`CONFLITO DETECTADO! Sugestão ${sugIndex + 1} descartada. Médico ${proposedDoctorId} ocupado em ${existingApp.start}. Sugerido: ${proposedStart}-${proposedEnd}`);
                                return false; // Conflito encontrado, descarta esta sugestão
                            }
                        }
                    }
                }
                // Se chegou aqui, nenhum agendamento nesta sugestão conflitou
                return true; 
            });
            // ------------------------------

            // --- Processamento final (adicionar ID) das sugestões VALIDADAS --- 
            const finalSuggestions = validatedSuggestions.map((suggestion, index) => {
                 return {
                     ...suggestion,
                     optionId: suggestion.optionId ?? (index + 1) 
                 };
            });
            // ----------------------------------------------------------------
            
            if (finalSuggestions.length === 0) {
                console.warn("Nenhuma sugestão da IA passou na validação de conflitos ou a IA não retornou opções.");
            } else {
                 console.log(`${finalSuggestions.length} sugestões validadas e sem conflitos serão enviadas ao frontend.`);
            }
           
            return NextResponse.json({ suggestions: finalSuggestions });

        } catch (parseError) {
            console.error("Erro CRÍTICO ao processar resposta...", parseError);
            throw new Error("A IA retornou uma resposta que não pôde ser processada...");
        }
      
    } catch (error) {
        console.error("Erro GERAL na API suggest-slots:", error);
        let errorMessage = "Erro interno no servidor ao sugerir horários.";
        if (error instanceof Error) {
           errorMessage = error.message; 
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// Função auxiliar para extrair JSON (pode ser aprimorada)
function extractJsonFromString(text: string): string {
    text = text.trim();
    const firstBraceIndex = text.indexOf('{');
    const lastBraceIndex = text.lastIndexOf('}');
    if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
        return text.substring(firstBraceIndex, lastBraceIndex + 1);
    } else {
        let cleanedFallback = text;
        if (cleanedFallback.startsWith('```json')) cleanedFallback = cleanedFallback.substring(7);
        else if (cleanedFallback.startsWith('```')) cleanedFallback = cleanedFallback.substring(3);
        if (cleanedFallback.endsWith('```')) cleanedFallback = cleanedFallback.substring(0, cleanedFallback.length - 3);
        return cleanedFallback.trim();
    }
}

// Opcional: adicionar handler GET se necessário no futuro
// export async function GET(request: NextRequest) { ... } 