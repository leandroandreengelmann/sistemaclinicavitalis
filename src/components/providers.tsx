'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { AppointmentsProvider } from "@/context/AppointmentsContext";
import { FinancialProvider } from '@/context/FinancialContext';
import { DoctorsProvider } from '@/context/DoctorsContext';
import { PatientsProvider } from '@/context/PatientsContext';
import { HealthPlansProvider } from '@/context/HealthPlansContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { BedManagementProvider } from '@/context/BedManagementContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DoctorsProvider>
        <FinancialProvider>
          <AppointmentsProvider>
            <PatientsProvider>
              <HealthPlansProvider>
                <InventoryProvider>
                  <BedManagementProvider>
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
                  </BedManagementProvider>
                </InventoryProvider>
              </HealthPlansProvider>
            </PatientsProvider>
          </AppointmentsProvider>
        </FinancialProvider>
      </DoctorsProvider>
    </ThemeProvider>
  );
} 