import { FinancialTransaction, TransactionStatus, TransactionType, PaymentMethod } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  transactions: FinancialTransaction[];
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (id: string) => void;
  getCategoryName: (id: string) => string;
  onMarkAsPaidReceived: (id: string) => void;
  // TODO: Add handlers for marking paid/received, etc.
}

// Helper para formatar moeda
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Helper para classes de status
const getStatusClass = (status: TransactionStatus): string => {
  switch (status) {
    case 'Pago':
    case 'Recebido':
      return 'bg-green-100 text-green-800';
    case 'Pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'Atrasado':
      return 'bg-red-100 text-red-800';
    case 'Cancelado':
        return 'bg-gray-100 text-gray-600 line-through';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper para classes de tipo
const getTypeClass = (type: TransactionType): string => {
    return type === 'Receita' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium';
}

export default function FinancialTransactionTable({
  transactions,
  onEdit,
  onDelete,
  getCategoryName,
  onMarkAsPaidReceived,
}: Props) {
  if (!transactions || transactions.length === 0) {
    return <p className="text-center text-gray-500 mt-6">Nenhuma transação encontrada.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="relative px-4 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{tx.description}</td>
              <td className={`px-4 py-3 whitespace-nowrap text-sm ${getTypeClass(tx.type)}`}>{tx.type}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{getCategoryName(tx.categoryId)}</td>
              <td className={`px-4 py-3 whitespace-nowrap text-sm ${getTypeClass(tx.type)}`}>{formatCurrency(tx.value)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {format(parseISO(tx.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {tx.paymentDate ? format(parseISO(tx.paymentDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(tx.status)}`}>
                  {tx.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                {(tx.status === 'Pendente' || tx.status === 'Atrasado') && (
                  <button
                    onClick={() => onMarkAsPaidReceived(tx.id)}
                    className="text-green-600 hover:text-green-900 mr-3"
                    title={tx.type === 'Receita' ? 'Marcar como Recebido' : 'Marcar como Pago'}
                  >
                    Baixar
                  </button>
                )}
                <button onClick={() => onEdit(tx)} className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                <button onClick={() => onDelete(tx.id)} className="text-red-600 hover:text-red-900">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 