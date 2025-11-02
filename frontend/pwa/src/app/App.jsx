import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppNewUI from '@features/newui/AppNewUI.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppNewUI />} />
      </Routes>
    </Router>
  );
}

export default App;
