'use client'; // Necessário se o layout tiver interatividade ou hooks

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation'; // Para destacar link ativo e obter parâmetros
import { 
    HomeIcon, 
    UserGroupIcon,
    ClipboardDocumentListIcon, 
    UserCircleIcon,
    ArrowLeftIcon, // Para recolher
    ArrowRightIcon, // Para expandir
    Cog6ToothIcon // Ícone para Configurações/Perfil
} from '@heroicons/react/24/outline';

// Interface para as props do layout
interface MedicoLayoutProps {
    children: ReactNode;
    params: Promise<{
        medicoId: string;
    }>;
}

// Componente do Sidebar (Estilo adaptado do DashboardLayout)
const MedicoSidebar = ({ medicoId }: { medicoId: string }) => {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Estado retrátil

    const menuItems = [
        { name: 'Visão Geral', href: `/dashboard/medico/${medicoId}`, icon: HomeIcon },
        { name: 'Meus Pacientes', href: `/dashboard/medico/${medicoId}/pacientes`, icon: UserGroupIcon },
        // Futuramente: Link para página dedicada de prontuários
        // { name: 'Prontuários', href: `/dashboard/medico/${medicoId}/prontuarios`, icon: ClipboardDocumentListIcon }, 
        { name: 'Meu Perfil', href: `/dashboard/medico/${medicoId}#perfil`, icon: UserCircleIcon }, // Link para âncora por agora
        // Adicionar mais itens conforme necessário
    ];

    return (
        <aside 
          className={`bg-white shadow-lg transition-all duration-300 ${ 
            isSidebarOpen ? 'w-64' : 'w-20'
          } h-screen flex flex-col sticky top-0 z-10`}
        >
          {/* Cabeçalho com botão de recolher/expandir */}
          <div className="p-4 flex items-center justify-between border-b h-16">
            <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
                {/* Poderia buscar o nome do médico aqui se desejado */}
                <h2 className="text-lg font-semibold text-indigo-600">Painel Médico</h2> 
            </div>
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
            >
                {isSidebarOpen ? (
                    <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                ) : (
                    <ArrowRightIcon className="h-5 w-5 text-gray-600" />
                )}
            </button>
          </div>

          {/* Navegação */}
          <nav className="mt-6 flex-grow">
              <ul className="space-y-2 px-2">
                  {menuItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== `/dashboard/medico/${medicoId}` && pathname.startsWith(item.href));
                      return (
                          <li key={item.name}>
                              <Link 
                                  href={item.href}
                                  title={item.name} // Mostra nome no hover quando recolhido
                                  className={`flex items-center p-3 rounded-lg transition-colors ${isActive 
                                      ? 'bg-indigo-100 text-indigo-700 font-medium' // Estilo ativo mais próximo
                                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                  }`}
                              >
                                  <item.icon className={`h-6 w-6 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} aria-hidden="true" />
                                  <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>{item.name}</span>
                              </Link>
                          </li>
                      );
                  })}
              </ul>
          </nav>
          {/* Rodapé (opcional) */}
          {/* <div className="p-4 border-t mt-auto"> ... </div> */}
        </aside>
    );
}

// Layout Principal
export default function MedicoLayout({ children, params }: MedicoLayoutProps) {
    const paramsObj = useParams();
    const medicoId = paramsObj.medicoId as string;

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <MedicoSidebar medicoId={medicoId} />
            
            {/* Conteúdo Principal */}
            {/* Testar se precisa de ml-64 ou ml-20 dependendo do estado */}
            <main className="flex-grow p-6 overflow-y-auto">
                {/* O conteúdo da página específica (page.tsx ou subrotas) será renderizado aqui */}
                {children}
            </main>
        </div>
    );
} 