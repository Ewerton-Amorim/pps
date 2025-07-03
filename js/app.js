import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, query, where, orderBy, 
  onSnapshot, doc, updateDoc, deleteDoc, getDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBs9zPC6P5wbgtEiD3ywbGyvnNFv2kvfw8",
  authDomain: "atividade-ifsc.firebaseapp.com",
  projectId: "atividade-ifsc",
  storageBucket: "atividade-ifsc.appspot.com",
  messagingSenderId: "171426800377",
  appId: "1:171426800377:web:008c25aa8c1356d7b13828",
  measurementId: "G-JDER507Y3Y"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ----- Cadastro -----
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password.length < 6) {
      alert('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      alert('As senhas não conferem.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Usuário cadastrado com sucesso!');
      await signOut(auth);
      window.location.href = 'index.html';
    } catch (error) {
      alert('Erro no cadastro: ' + error.message);
    }
  });
}

// ----- Login com Email e Senha -----
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login realizado com sucesso!');
      window.location.href = 'tasks.html';
    } catch (error) {
      alert('Erro no login: ' + error.message);
    }
  });
}

// ----- Login com Google -----
const googleLoginBtn = document.getElementById('googleLogin');

if (googleLoginBtn) {
  const provider = new GoogleAuthProvider();

  googleLoginBtn.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, provider);
      alert("Login com Google realizado!");
      window.location.href = 'tasks.html';
    } catch (error) {
      alert("Erro no login com Google: " + error.message);
    }
  });
}

// ----- Tarefas e Logout -----
const taskForm = document.getElementById('taskForm');
const logoutBtn = document.getElementById('logoutBtn');
const loadingElement = document.getElementById('loading');
const tasksList = document.getElementById('tasksList');

if (taskForm && logoutBtn && loadingElement && tasksList) {

  // Adicionar Tarefa
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskText = document.getElementById('taskInput').value.trim();
    if (!taskText) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        userId: auth.currentUser.uid,
        title: taskText,
        completed: false,
        createdAt: serverTimestamp()
      });
      taskForm.reset();
    } catch (error) {
      alert('Erro ao adicionar: ' + error.message);
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
  });

  // Carregar tarefas
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      onSnapshot(q, (snapshot) => {
        loadingElement.style.display = 'none';
        tasksList.innerHTML = '';

        if (snapshot.empty) {
          tasksList.innerHTML = '<li class="empty">Nenhuma tarefa</li>';
          return;
        }

        snapshot.forEach((docSnap) => {
          const task = docSnap.data();
          const li = document.createElement('li');
          li.className = task.completed ? 'completed' : '';
          li.innerHTML = `
            <span>${task.title}</span>
            <div>
              <button class="toggle-btn" data-id="${docSnap.id}">${task.completed ? '↩' : '✓'}</button>
              <button class="delete-btn" data-id="${docSnap.id}">✕</button>
            </div>
          `;
          tasksList.appendChild(li);
        });

        // Botões de concluir e excluir
        document.querySelectorAll('.toggle-btn').forEach(btn =>
          btn.addEventListener('click', () => toggleTask(btn.dataset.id)));

        document.querySelectorAll('.delete-btn').forEach(btn =>
          btn.addEventListener('click', () => deleteTask(btn.dataset.id)));
      });
    } else {
      window.location.href = 'index.html';
    }
  });
}

// ----- Marcar como concluída / desfazer -----
const toggleTask = async (taskId) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    await updateDoc(taskRef, {
      completed: !taskSnap.data().completed
    });
  } catch (error) {
    alert("Erro ao atualizar: " + error.message);
  }
};

// ----- Excluir tarefa -----
const deleteTask = async (taskId) => {
  if (confirm('Excluir tarefa?')) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      alert("Erro ao excluir: " + error.message);
    }
  }
};