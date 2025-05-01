import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises'; // Para interagir com o sistema de arquivos
import path from 'path';
import { Doctor } from '@/types'; // Importar o tipo Doctor

// Caminho para o arquivo JSON de médicos
const doctorsFilePath = path.resolve(process.cwd(), 'src/data/doctors.json');

// --- Função para ler os médicos do arquivo --- 
async function readDoctors(): Promise<Doctor[]> {
    try {
        const data = await fs.readFile(doctorsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        // Se o arquivo não existir ou erro de leitura, retorna array vazio (ou lança erro)
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error("Erro ao ler o arquivo de médicos:", error);
        throw new Error('Não foi possível ler os dados dos médicos.');
    }
}

// --- Função para escrever os médicos no arquivo --- 
async function writeDoctors(doctors: Doctor[]): Promise<void> {
    try {
        const data = JSON.stringify(doctors, null, 2); // Formata com indentação
        await fs.writeFile(doctorsFilePath, data, 'utf-8');
    } catch (error) {
        console.error("Erro ao escrever no arquivo de médicos:", error);
        throw new Error('Não foi possível salvar os dados dos médicos.');
    }
}

// --- Handler para PUT (Atualização Completa) ou PATCH (Atualização Parcial) ---
// Vamos usar PUT para simplificar, esperando o objeto completo do médico
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    const doctorId = params.id; // Access id via context

    if (!doctorId) {
        return NextResponse.json({ error: 'ID do médico não fornecido.' }, { status: 400 });
    }

    try {
        const updatedDoctorData: Partial<Doctor> = await request.json(); // Recebe os dados atualizados

        // Validação básica dos dados recebidos (pode ser mais robusta)
        if (!updatedDoctorData || typeof updatedDoctorData !== 'object') {
             return NextResponse.json({ error: 'Dados inválidos fornecidos.' }, { status: 400 });
        }

        // Ler a lista atual de médicos
        const doctors = await readDoctors();

        // Encontrar o índice do médico a ser atualizado
        const doctorIndex = doctors.findIndex(doc => doc.id === doctorId);

        if (doctorIndex === -1) {
            return NextResponse.json({ error: 'Médico não encontrado.' }, { status: 404 });
        }

        // Atualizar os dados do médico encontrado
        // Usamos spread operator para mesclar os dados antigos com os novos
        // Garantimos que o ID não seja sobrescrito acidentalmente
        doctors[doctorIndex] = { 
            ...doctors[doctorIndex], // Mantém dados antigos
            ...updatedDoctorData,   // Sobrescreve com os novos
            id: doctorId             // Garante que o ID permaneça o mesmo
        };

        // Salvar a lista atualizada no arquivo
        await writeDoctors(doctors);

        console.log(`Médico com ID ${doctorId} atualizado com sucesso.`);
        return NextResponse.json(doctors[doctorIndex]); // Retorna o médico atualizado

    } catch (error) {
        console.error(`Erro ao atualizar médico ${doctorId}:`, error);
        const message = error instanceof Error ? error.message : 'Erro interno no servidor ao atualizar médico.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Poderíamos adicionar handlers GET, DELETE se necessário no futuro
// export async function GET(...) { ... }
// export async function DELETE(...) { ... } 