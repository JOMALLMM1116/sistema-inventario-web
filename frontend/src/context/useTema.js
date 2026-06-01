// src/context/useTema.js
// Maneja el tema activo (claro / oscuro / gris).
// Lo aplica al <html> y lo guarda para que se recuerde al recargar.

import { useState, useEffect } from "react";

export function useTema() {
  const [tema, setTema] = useState(
    () => localStorage.getItem("tema") || "claro"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-tema", tema);
    localStorage.setItem("tema", tema);
  }, [tema]);

  return [tema, setTema];
}
