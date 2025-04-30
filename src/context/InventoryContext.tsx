'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { InventoryItem, StockMovement, MovementType } from '@/types';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos

// Chaves para localStorage
const ITEMS_STORAGE_KEY = 'clinicInventoryItems';
const MOVEMENTS_STORAGE_KEY = 'clinicStockMovements';

// Tipo para dados editáveis (usado no EditItemModal)
export type EditableItemData = Partial<Omit<InventoryItem, 'id' | 'quantity' | 'createdAt' | 'updatedAt'> >

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  stockMovements: StockMovement[];
  isLoading: boolean;
  addItem: (itemData: Omit<InventoryItem, 'id' | 'quantity' | 'createdAt' | 'updatedAt'>, initialQuantity: number, initialLot?: string, initialExpiry?: string) => void;
  addStock: (itemId: string, quantity: number, reason?: string, lotNumber?: string, expiryDate?: string) => void; // Entrada
  removeStock: (itemId: string, quantity: number, reason?: string, lotNumber?: string) => void; // Saída
  updateItem: (itemId: string, updates: EditableItemData) => void;
  deleteItem: (itemId: string) => void;
  getItemById: (itemId: string) => InventoryItem | undefined;
  getItemMovements: (itemId: string) => StockMovement[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(ITEMS_STORAGE_KEY);
      const storedMovements = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
      if (storedItems) {
        setInventoryItems(JSON.parse(storedItems));
      }
      if (storedMovements) {
        setStockMovements(JSON.parse(storedMovements));
      }
    } catch (error) {
      console.error("Erro ao carregar dados do estoque do localStorage:", error);
      toast.error("Erro ao carregar estoque.");
      // Poderia inicializar com dados padrão se necessário
    }
    setIsLoading(false);
  }, []);

  // Salvar itens no localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(inventoryItems));
      } catch (error) {
        console.error("Erro ao salvar itens do estoque:", error);
      }
    }
  }, [inventoryItems, isLoading]);

  // Salvar movimentações no localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(stockMovements));
      } catch (error) {
        console.error("Erro ao salvar movimentações do estoque:", error);
      }
    }
  }, [stockMovements, isLoading]);

  // Função para registrar movimentação
  const logMovement = useCallback((itemId: string, type: MovementType, quantityChange: number, reason?: string, lotNumber?: string) => {
    const newMovement: StockMovement = {
      id: uuidv4(),
      itemId,
      type,
      quantityChange,
      reason,
      timestamp: new Date().toISOString(),
      relatedLotNumber: lotNumber,
      // userId: Deverá ser adicionado quando houver autenticação
    };
    setStockMovements(prev => [...prev, newMovement]);
  }, []);

  // Adicionar um novo item ao catálogo
  const addItem = (
    itemData: Omit<InventoryItem, 'id' | 'quantity' | 'createdAt' | 'updatedAt'>, 
    initialQuantity: number,
    initialLot?: string,
    initialExpiry?: string
    ) => {
    
    if (inventoryItems.some(item => item.name.toLowerCase() === itemData.name.toLowerCase())) {
        toast.error(`Item "${itemData.name}" já existe no catálogo.`);
        return; 
    }

    if (initialQuantity < 0) {
        toast.error("Quantidade inicial não pode ser negativa.");
        return;
    }

    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...itemData,
      id: uuidv4(),
      quantity: initialQuantity, // Começa com a quantidade inicial
      lotNumber: initialLot, // Define lote e validade iniciais se fornecidos
      expiryDate: initialExpiry,
      createdAt: now,
      updatedAt: now,
    };

    setInventoryItems(prev => [...prev, newItem]);
    
    // Registrar a entrada inicial se houver quantidade
    if (initialQuantity > 0) {
        logMovement(newItem.id, 'AjusteInicial', initialQuantity, 'Cadastro inicial do item', initialLot);
    }
    toast.success(`Item "${newItem.name}" adicionado ao estoque.`);
  };

  // Dar entrada de estoque (aumentar quantidade)
  const addStock = (itemId: string, quantity: number, reason?: string, lotNumber?: string, expiryDate?: string) => {
    if (quantity <= 0) {
      toast.error("Quantidade para entrada deve ser positiva.");
      return;
    }
    setInventoryItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          // Se o lote ou validade da entrada for diferente, pode ser necessário tratar
          // (ex: criar sub-itens por lote/validade ou apenas atualizar o principal? 
          // Por simplicidade, vamos apenas atualizar o item principal e o log)
          const updatedItem = {
            ...item,
            quantity: item.quantity + quantity,
            lotNumber: lotNumber ?? item.lotNumber, // Atualiza se um novo lote for informado
            expiryDate: expiryDate ?? item.expiryDate, // Atualiza se nova validade for informada
            updatedAt: new Date().toISOString(),
          };
          logMovement(itemId, 'Entrada', quantity, reason, lotNumber);
          toast.success(`${quantity} ${item.unit}(s) de "${item.name}" adicionado(s).`);
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Dar baixa de estoque (diminuir quantidade)
  const removeStock = (itemId: string, quantity: number, reason?: string, lotNumber?: string) => {
    if (quantity <= 0) {
      toast.error("Quantidade para saída deve ser positiva.");
      return;
    }
    let itemRemoved = false;
    setInventoryItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          if (item.quantity < quantity) {
            toast.error(`Estoque insuficiente para "${item.name}". Disponível: ${item.quantity}`);
            return item; // Não altera se não houver estoque
          }
          const updatedItem = {
            ...item,
            quantity: item.quantity - quantity,
            updatedAt: new Date().toISOString(),
          };
          // Nota: A baixa geralmente consome de um lote específico, mas aqui simplificamos.
          // Se um lote específico foi passado, registramos no log.
          logMovement(itemId, 'Saída', -quantity, reason, lotNumber);
          toast.success(`${quantity} ${item.unit}(s) de "${item.name}" removido(s).`);
          itemRemoved = true;
          return updatedItem;
        }
        return item;
      })
    );
    // Se o item não foi encontrado (pouco provável se a UI estiver correta)
    // if (!itemRemoved) { 
    //   toast.error("Item não encontrado para dar baixa.");
    // }
  };

  // --- Função para Atualizar Item (sem mexer na quantidade) ---
  const updateItem = (itemId: string, updates: EditableItemData) => {
    setInventoryItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          // Mescla o item existente com as atualizações, garantindo que quantity e createdAt não mudem
          return {
            ...item,       // Dados originais (incluindo id, quantity, createdAt)
            ...updates,    // Dados atualizados (nome, desc, cat, unit, minLevel, etc.)
            updatedAt: new Date().toISOString(), // Atualiza sempre o timestamp
          };
        }
        return item;
      })
    );
    // Não loga movimentação, pois é edição de dados, não de quantidade
    // Toast de sucesso é mostrado no modal
  };
  // --- Fim updateItem ---

  // --- Função para Excluir Item (e suas movimentações) ---
  const deleteItem = (itemId: string) => {
    const itemToDelete = inventoryItems.find(item => item.id === itemId);
    if (!itemToDelete) {
      toast.error("Item não encontrado para exclusão.");
      return;
    }

    // Remove o item da lista principal
    setInventoryItems(prev => prev.filter(item => item.id !== itemId));

    // Remove todas as movimentações associadas a este item
    setStockMovements(prev => prev.filter(move => move.itemId !== itemId));

    toast.success(`Item "${itemToDelete.name}" e seu histórico foram excluídos.`);
  };
  // --- Fim deleteItem ---

  // Buscar item por ID
  const getItemById = (itemId: string): InventoryItem | undefined => {
    return inventoryItems.find(item => item.id === itemId);
  };

  // Buscar movimentações de um item específico
  const getItemMovements = (itemId: string): StockMovement[] => {
    return stockMovements.filter(move => move.itemId === itemId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Mais recentes primeiro
  };

  // Renderização do Provider
  return (
    <InventoryContext.Provider
      value={{
        inventoryItems,
        stockMovements,
        isLoading,
        addItem,
        addStock,
        removeStock,
        updateItem,
        deleteItem,
        getItemById,
        getItemMovements,
      }}
    >
      {!isLoading && children} {/* Renderiza children apenas após carregar dados */}
    </InventoryContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}; 