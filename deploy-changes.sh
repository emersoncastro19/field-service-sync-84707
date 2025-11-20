#!/bin/bash

echo "========================================"
echo "    SUBIENDO CAMBIOS A VERCEL"
echo "========================================"
echo

echo "1. Verificando estado de Git..."
git status
echo

echo "2. Agregando todos los cambios..."
git add .
echo

echo "3. Haciendo commit..."
read -p "Ingresa el mensaje del commit (o presiona Enter para usar mensaje por defecto): " commit_message
if [ -z "$commit_message" ]; then
    commit_message="Actualizacion de reportes - filtros mejorados"
fi

git commit -m "$commit_message"
echo

echo "4. Subiendo a repositorio..."
git push origin main
echo

echo "========================================"
echo "   CAMBIOS SUBIDOS EXITOSAMENTE!"
echo "========================================"
echo
echo "Vercel desplegará automáticamente en 1-3 minutos."
echo "Ve a tu dashboard de Vercel para monitorear el progreso:"
echo "https://vercel.com/dashboard"
echo