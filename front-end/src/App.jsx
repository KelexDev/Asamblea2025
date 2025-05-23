import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import List from './pages/productos/List';
import AddProducts from './pages/productos/AddProducts';
import Nosotros from './pages/Nosotros';
import Administrador from './pages/Administrador';
import Participante from './pages/Participante';
import './assets/App.css';



function App() {
  return (
    <Router>
      {/* Layout principal: flex column y altura completa */}
      <div className="d-flex flex-column min-vh-100">
        <Header />
        
        {/* Contenedor principal de las rutas, que crece para empujar el footer */}
        <main className="flex-grow-1">
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/Login' element={<Login />} />
            <Route path='/List' element={<List />} />
            <Route path='/AddProducts' element={<AddProducts />} />
            <Route path='/Nosotros' element={<Nosotros />} />
            <Route path='/Administrador' element={<Administrador />} />
            <Route path='/Participante' element={<Participante />} />

          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
