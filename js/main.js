import { db, collection, addDoc, onSnapshot } from './firebase-config.js';

const transactionsRef = collection(db, "transactions");

const form = document.querySelector('#finance-form');
const descInput = document.querySelector('#desc-input');
const valueInput = document.querySelector('#value-input');
const list = document.querySelector('#transactions-list');

// Elementos do Dashboard de Resumo
const totalIncomeEl = document.querySelector('#total-income');
const totalExpensesEl = document.querySelector('#total-expenses');
const totalBalanceEl = document.querySelector('#total-balance');

// Atividade 3: Função de cálculo usando métodos modernos de Array (reduce)
const updateValues = (transactions) => {
    const incomes = transactions
        .filter(t => t.value > 0)
        .reduce((acc, t) => acc + t.value, 0);

    const expenses = transactions
        .filter(t => t.value < 0)
        .reduce((acc, t) => acc + t.value, 0);

    const balance = incomes + expenses;

    totalIncomeEl.innerText = `R$ ${incomes.toFixed(2)}`;
    totalExpensesEl.innerText = `R$ ${Math.abs(expenses).toFixed(2)}`;
    totalBalanceEl.innerText = `R$ ${balance.toFixed(2)}`;
    
    // Altera a cor do texto do saldo caso esteja negativo
    totalBalanceEl.style.color = balance >= 0 ? '#2b8a3e' : '#c92a2a';
};

const saveTransaction = async (e) => {
    e.preventDefault();
    const description = descInput.value;
    const value = parseFloat(valueInput.value);

    try {
        await addDoc(transactionsRef, { description, value });
        form.reset();
    } catch (error) {
        console.error("Erro ao salvar transação: ", error);
    }
};

const renderTransactions = () => {
    onSnapshot(transactionsRef, (snapshot) => {
        list.innerHTML = "";
        const allTransactions = [];
        
        snapshot.forEach((doc) => {
            const { description, value } = doc.data();
            allTransactions.push({ description, value });
            
            const li = document.createElement('li');
            li.className = value >= 0 ? 'income' : 'expense';
            li.innerHTML = `${description} <span>R$ ${value.toFixed(2)}</span>`;
            list.appendChild(li);
        });

        // Atualiza os valores do painel matemático
        updateValues(allTransactions);
    });
};

form.addEventListener('submit', saveTransaction);
renderTransactions();