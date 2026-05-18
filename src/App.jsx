import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductPage from './components/ProductPage';
import EyewearPage from './components/EyewearPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductPage />} />
        <Route path="/eyewear" element={<EyewearPage />} />
      </Routes>
    </BrowserRouter>
  );
}
