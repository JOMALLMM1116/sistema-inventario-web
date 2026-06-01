// src/context/AuthContext.jsx
import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    // Intentar recuperar sesión existente al recargar la página
    const sesionGuardada = localStorage.getItem('si_sesion');
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  const login = (datosUsuario) => {
    setUsuario(datosUsuario);
    localStorage.setItem('si_sesion', JSON.stringify(datosUsuario));
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('si_sesion');
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ¡ESTA ES LA LÍNEA CRÍTICA QUE CAUSABA EL ERROR! Asegúrate de que tenga el "export"
export const useAuth = () => useContext(AuthContext);
