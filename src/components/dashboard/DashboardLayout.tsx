'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFinanceMenuOpen, setIsFinanceMenuOpen] = useState(false);
  const [isCadastroMenuOpen, setIsCadastroMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`bg-white shadow-lg transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } fixed h-full z-10`}
      >
        <div className="p-4 flex items-center justify-between border-b">
          <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
            <h1 className="text-xl font-bold text-indigo-600">Clínica Med</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="mt-6">
          <ul className="space-y-2 px-2">
            <li>
              <Link href="/dashboard" className="flex items-center p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/agendamentos" className="flex items-center p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l-4-4m0 0l-4 4m4-4v12" />
                </svg>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Agendamentos</span>
              </Link>
            </li>
            <li>
              <Link href="/" className="flex items-center p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Calendário</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/patients" className="flex items-center p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Pacientes</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/doctors" className="flex items-center p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Médicos</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/healthplans" 
                className="flex items-center p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Planos de Saúde</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => setIsCadastroMenuOpen(!isCadastroMenuOpen)}
                className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors group"
              >
                <div className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-3" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.75 19.5h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                  </svg>
                  <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Cadastro</span>
                </div>
                <ChevronDownIcon 
                  className={`h-4 w-4 text-gray-500 group-hover:text-indigo-600 transition-transform duration-200 ${isCadastroMenuOpen ? 'rotate-180' : ''} ${isSidebarOpen ? 'block' : 'hidden'}`}
                />
              </button>

              {isSidebarOpen && isCadastroMenuOpen && (
                <ul className="mt-1 pl-8 space-y-1">
                  <li>
                    <Link href="/dashboard/register/doctor" className="flex items-center p-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-500 rounded-lg transition-colors">
                      Cadastrar Médico
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/register/patient" className="flex items-center p-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-500 rounded-lg transition-colors">
                      Cadastrar Paciente
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/register/healthplan" className="flex items-center p-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-500 rounded-lg transition-colors">
                       Cadastrar Plano de Saúde
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link 
                href="/dashboard/healthplans" 
                className="flex items-center p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Planos de Saúde</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => setIsFinanceMenuOpen(!isFinanceMenuOpen)}
                className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors group"
              >
                <div className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-3" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Financeiro</span>
                </div>
                <ChevronDownIcon 
                  className={`h-4 w-4 text-gray-500 group-hover:text-indigo-600 transition-transform duration-200 ${isFinanceMenuOpen ? 'rotate-180' : ''} ${isSidebarOpen ? 'block' : 'hidden'}`}
                />
              </button>

              {isSidebarOpen && isFinanceMenuOpen && (
                <ul className="mt-1 pl-8 space-y-1">
                  <li>
                    <Link href="/dashboard/financeiro" className="flex items-center p-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-500 rounded-lg transition-colors">
                      Visão Geral
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/financeiro/relatorios" className="flex items-center p-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-500 rounded-lg transition-colors">
                      Relatórios
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link href="#" className="flex items-center p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Configurações</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 