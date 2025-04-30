import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
// Precisa importar os tipos aqui também
import { Prescription, PrescriptionItem } from '@/context/BedManagementContext'; 
// Importar Patient também
import { Patient } from '@/context/PatientsContext';

// Registrar fontes (Opcional, mas recomendado para consistência e caracteres especiais)
// Font.register({
//   family: 'Roboto',
//   fonts: [
//     { src: '/fonts/Roboto-Regular.ttf' }, // Substitua pelo caminho correto se usar fontes customizadas
//     { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
//   ]
// });

// Definir estilos usando StyleSheet
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    // fontFamily: 'Roboto' // Aplicar fonte registrada
    fontSize: 10,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  patientInfo: {
    fontSize: 11,
    marginBottom: 15,
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingBottom: 3,
    color: '#1a202c' // Cinza escuro
  },
  prescriptionContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0', // Cinza claro
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f8fafc' // Fundo levemente acinzentado
  },
  prescriptionHeader: {
    fontSize: 9,
    color: '#4a5568', // Cinza médio
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prescriptionNotes: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#718096', // Cinza mais claro
    marginBottom: 8,
  },
  itemContainer: {
    marginBottom: 5,
    paddingLeft: 10, // Pequena indentação
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#2d3748', // Cinza mais escuro
  },
  itemDetails: {
    fontSize: 9,
    color: '#4a5568',
    marginLeft: 5, // Indentação dos detalhes
    lineHeight: 1.3,
  },
   footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: 'grey',
        fontSize: 8,
    },
});

interface PrescriptionReportDocumentProps {
  patient: Patient | null;
  prescriptions: Prescription[];
}

const PrescriptionReportDocument: React.FC<PrescriptionReportDocumentProps> = ({ patient, prescriptions }) => (
  <Document title={`Prescrições - ${patient?.name || 'Paciente'}`}>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Relatório de Prescrições</Text>
        {/* Adicionar mais detalhes da clínica/hospital aqui se desejar */}
      </View>

      {/* Informações do Paciente */}
      {patient && (
        <View style={styles.patientInfo}>
          <Text>Paciente: {patient.name || 'Não informado'}</Text>
          <Text>CPF: {patient.cpf || 'Não informado'}</Text>
          <Text>Data Nasc.: {patient.birthDate || 'Não informada'}</Text>
          {/* Adicionar mais infos do paciente se relevante */}
        </View>
      )}

      <Text style={styles.sectionTitle}>Prescrições Registradas</Text>

      {/* Lista de Prescrições */}
      {prescriptions.length > 0 ? (
        prescriptions.map((prescription) => (
          <View key={prescription.id} style={styles.prescriptionContainer}>
            <View style={styles.prescriptionHeader}>
               <Text>Data: {new Date(prescription.prescriptionDate).toLocaleString('pt-BR')}</Text>
               {prescription.prescriberName && <Text>Prescritor: {prescription.prescriberName}</Text>}
            </View>
            {prescription.notes && <Text style={styles.prescriptionNotes}>Obs. Geral: {prescription.notes}</Text>}

            {/* Itens da Prescrição */}
            {prescription.items.map((item) => (
              <View key={item.id} style={styles.itemContainer}>
                <Text style={styles.itemName}>{item.medicationName}</Text>
                <Text style={styles.itemDetails}>
                  Dose: {item.dosage}, Via: {item.route}, Freq.: {item.frequency}
                  {item.duration ? `, Duração: ${item.duration}` : ''}
                </Text>
                {item.notes && <Text style={[styles.itemDetails, { fontStyle: 'italic' }]}>Obs Item: {item.notes}</Text>}
              </View>
            ))}
          </View>
        ))
      ) : (
        <Text>Nenhuma prescrição encontrada.</Text>
      )}
       <Text style={styles.footer} fixed>Gerado em: {new Date().toLocaleString('pt-BR')}</Text>
    </Page>
  </Document>
);

export default PrescriptionReportDocument; 