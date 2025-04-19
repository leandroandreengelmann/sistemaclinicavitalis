import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/calendar-overrides.css";
import "@/styles/dashboard.css";
import { AppointmentsProvider } from "@/context/AppointmentsContext";
import { FinancialProvider } from '@/context/FinancialContext';
import { DoctorsProvider } from '@/context/DoctorsContext';
import { PatientsProvider } from '@/context/PatientsContext';
import { HealthPlansProvider } from '@/context/HealthPlansContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clínica - Agendamentos",
  description: "Calendário de Agendamentos da Clínica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <DoctorsProvider>
          <FinancialProvider>
            <AppointmentsProvider>
              <PatientsProvider>
                <HealthPlansProvider>
                  <Toaster 
                    position="top-center" 
                    toastOptions={{
                      style: {
                        padding: '16px',
                        fontSize: '1.1rem',
                        minWidth: '250px',
                      },
                    }}
                  />
                  {children}
                </HealthPlansProvider>
              </PatientsProvider>
            </AppointmentsProvider>
          </FinancialProvider>
        </DoctorsProvider>
      </body>
    </html>
  );
} 