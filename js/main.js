import { db, collection, addDoc, onSnapshot } from './firebase-config.js';

// Referência da coleção no Firestore
const transactionsRef = collection(db, "transactions");

// Captura de elementos do DOM
const form = document.querySelector('#finance-form');
const descInput = document.querySelector('#desc-input');
const valueInput = document.querySelector('#value-input');
const list = document.querySelector('#transactions-list');

// Salvar nova transação (Arrow Function)
const saveTransaction = async (e) => {
    e.preventDefault();

    const description = descInput.value;
    const value = parseFloat(valueInput.value);

    try {
        // Gravando no Firestore
        await addDoc(transactionsRef, { description, value });
        form.reset();
    } catch (error) {
        console.error("Erro ao salvar transação: ", error);
    }
};

// Listar dados em tempo real usando onSnapshot (Arrow Function + Desestruturação)
const renderTransactions = () => {
    onSnapshot(transactionsRef, (snapshot) => {
        list.innerHTML = ""; // Limpa a lista antes de renderizar
        
        snapshot.forEach((doc) => {
            // Desestruturação do objeto de dados do documento
            const { description, value } = doc.data();
            
            const li = document.createElement('li');
            li.className = value >= 0 ? 'income' : 'expense';
            li.innerHTML = `${description}: <span>R$ ${value.toFixed(2)}</span>`;
            
            list.appendChild(li);
        });
    });
};

// Event Listeners
form.addEventListener('submit', saveTransaction);

// Inicializa a escuta em tempo real ao carregar o script
renderTransactions();