import React, { useEffect } from 'react';
import { useExpensesStore } from '@/store/expensesStore';
import ExpensesSummary from './ExpensesSummary';
import ExpenseForm from './ExpenseForm';
import ExpensesFilters from './ExpensesFilters';
import ExpensesList from './ExpensesList';

const ExpensesManager: React.FC = () => {
  const { fetchExpenses } = useExpensesStore();

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <div className="space-y-4">
      <ExpensesSummary />
      <ExpenseForm />
      <ExpensesFilters />
      <ExpensesList />
    </div>
  );
};

export default ExpensesManager;
