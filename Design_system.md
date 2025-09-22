# �� Design System - Ultimate Frisbee Stats App

## �� Índice
- [Colores](#colores)
- [Tipografía](#tipografía)
- [Espaciado](#espaciado)
- [Componentes](#componentes)
- [Estados](#estados)
- [Layout](#layout)
- [Responsive](#responsive)

---

## 🎨 Colores

### Colores Principales
```css
/* Naranja - Color Principal */
--orange-50: #FFF7ED
--orange-100: #FFEDD5
--orange-200: #FED7AA
--orange-500: #F97316  /* PRIMARY */
--orange-600: #EA580C  /* PRIMARY HOVER */
--orange-700: #C2410C

/* Grises - Neutros */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827

/* Estados */
--green-500: #10B981  /* SUCCESS */
--red-500: #EF4444    /* ERROR */
--yellow-500: #F59E0B /* WARNING */
--blue-500: #3B82F6   /* INFO */
```

### Uso de Colores
- **Primary**: `bg-orange-500 hover:bg-orange-600 text-white`
- **Secondary**: `bg-white text-orange-600 border-2 border-orange-200`
- **Success**: `bg-green-500 hover:bg-green-600 text-white`
- **Error**: `bg-red-500 hover:bg-red-600 text-white`
- **Warning**: `bg-yellow-500 hover:bg-yellow-600 text-white`

---

## �� Tipografía

### Jerarquía de Texto
```css
/* Títulos Principales */
.heading-xl: text-2xl sm:text-3xl font-bold
.heading-lg: text-xl sm:text-2xl font-semibold
.heading-md: text-lg sm:text-xl font-semibold
.heading-sm: text-base sm:text-lg font-semibold

/* Texto del Cuerpo */
.body-lg: text-base sm:text-lg
.body-md: text-sm sm:text-base
.body-sm: text-xs sm:text-sm

/* Texto Especial */
.caption: text-xs text-gray-500
.label: text-sm font-medium text-gray-700
```

### Alineación
- **Títulos de Modales**: `text-center text-lg sm:text-xl font-semibold`
- **Descripciones**: `text-center text-sm sm:text-base`
- **Labels**: `text-sm font-medium text-gray-700`

---

## �� Espaciado

### Sistema de Espaciado (Tailwind)
```css
/* Espaciado Base */
--space-1: 0.25rem  /* 4px */
--space-2: 0.5rem   /* 8px */
--space-3: 0.75rem  /* 12px */
--space-4: 1rem     /* 16px */
--space-6: 1.5rem   /* 24px */
--space-8: 2rem     /* 32px */
--space-12: 3rem    /* 48px */
--space-16: 4rem     /* 64px */
```

### Uso Común
- **Padding de Modales**: `p-6`
- **Padding de Cards**: `p-4`
- **Gap entre elementos**: `space-y-4`, `space-y-6`
- **Margen de secciones**: `mb-4`, `mb-6`

---

## �� Componentes

### Botones

#### Botones Primarios
```css
.btn-primary {
  @apply bg-orange-500 hover:bg-orange-600 text-white shadow-lg border-0 rounded-lg;
  @apply transition-all duration-200;
}
```

#### Botones Secundarios
```css
.btn-secondary {
  @apply bg-white text-orange-600 border-2 border-orange-200 hover:bg-orange-50;
  @apply transition-all duration-200;
}
```

#### Tamaños de Botones
- **Small**: `h-8 px-3 text-sm`
- **Medium**: `h-10 px-4 text-sm`
- **Large**: `h-12 px-6 text-base`
- **Extra Large**: `h-16 px-8 text-lg`

#### Botones de Eventos (Coach)
```css
.btn-event {
  @apply h-20 bg-orange-500 hover:bg-orange-600 text-white shadow-lg border-0 rounded-lg;
  @apply flex items-center justify-center;
}
```

### Modales

#### Contenedor Principal
```css
.modal-container {
  @apply w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto mx-4 p-6;
}
```

#### Header de Modal
```css
.modal-header {
  @apply pb-4;
}

.modal-title {
  @apply text-center text-lg sm:text-xl font-semibold;
}

.modal-description {
  @apply text-center text-sm sm:text-base;
}
```

#### Botones de Modal
```css
.modal-actions {
  @apply flex space-x-3 pt-4 border-t;
}

.modal-btn-cancel {
  @apply flex-1 h-12;
}

.modal-btn-confirm {
  @apply flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white;
}
```

### Cards

#### Card Principal
```css
.card {
  @apply bg-white rounded-lg border border-gray-200 p-4;
}

.card-header {
  @apply pb-4;
}

.card-title {
  @apply text-lg font-semibold text-gray-900;
}
```

### Tabs de Selección

#### Tabs de Género (Mixtos)
```css
.gender-tab {
  @apply h-10 transition-all duration-200;
  @apply flex items-center justify-center space-x-2;
}

.gender-tab-active {
  @apply bg-orange-500 text-white border-2 border-orange-600 shadow-lg;
}

.gender-tab-inactive {
  @apply bg-white text-orange-600 border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300;
}
```

---

## 🔄 Estados

### Estados de Botones
- **Default**: Color base
- **Hover**: Color más oscuro + transición
- **Active**: Color más oscuro + sombra
- **Disabled**: Opacidad 50% + cursor not-allowed
- **Loading**: Spinner + disabled

### Estados de Modales
- **Open**: Animación de entrada
- **Close**: Animación de salida
- **Loading**: Overlay + spinner

### Estados de Formularios
- **Valid**: Borde verde
- **Invalid**: Borde rojo + mensaje de error
- **Required**: Asterisco rojo

---

## �� Layout

### Grid System
```css
/* Grid de Botones de Eventos */
.event-buttons-grid {
  @apply grid grid-cols-2 gap-4 max-w-2xl w-full;
}

/* Grid de Selección de Género */
.gender-selection-grid {
  @apply grid grid-cols-2 gap-3;
}

/* Grid de Confirmación */
.confirmation-grid {
  @apply grid grid-cols-2 gap-3;
}
```

### Flexbox
```css
/* Centrado de Contenido */
.center-content {
  @apply flex justify-center items-center;
}

/* Layout Horizontal */
.horizontal-layout {
  @apply flex items-center space-x-2;
}

/* Layout Vertical */
.vertical-layout {
  @apply flex flex-col space-y-4;
}
```

---

## 📱 Responsive

### Breakpoints
- **Mobile**: `< 640px`
- **Tablet**: `640px - 1024px`
- **Desktop**: `> 1024px`

### Clases Responsive
```css
/* Texto Responsive */
.text-responsive {
  @apply text-sm sm:text-base;
}

/* Padding Responsive */
.padding-responsive {
  @apply p-4 sm:p-6;
}

/* Grid Responsive */
.grid-responsive {
  @apply grid-cols-1 sm:grid-cols-2;
}
```

### Modales Responsive
- **Mobile**: `w-[95vw] mx-4`
- **Tablet**: `max-w-lg`
- **Desktop**: `max-w-2xl`

---

## �� Reglas de Uso

### Consistencia
1. **Siempre usar el color naranja** como principal
2. **Títulos centrados** en modales
3. **Transiciones suaves** en todos los elementos interactivos
4. **Sombras consistentes** en elementos elevados

### Accesibilidad
1. **Contraste mínimo** de 4.5:1 para texto
2. **Estados claros** para elementos interactivos
3. **Tamaños mínimos** de 44px para elementos táctiles
4. **Navegación por teclado** funcional

### Performance
1. **Transiciones CSS** en lugar de JavaScript
2. **Clases de Tailwind** para consistencia
3. **Imágenes optimizadas** y lazy loading
4. **Código modular** y reutilizable

---

## �� Implementación

### Variables CSS
```css
:root {
  --primary-color: #F97316;
  --primary-hover: #EA580C;
  --border-radius: 0.5rem;
  --transition: all 0.2s ease-in-out;
  --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Clases de Utilidad
```css
.primary-btn {
  @apply bg-orange-500 hover:bg-orange-600 text-white;
  @apply px-4 py-2 rounded-lg transition-all duration-200;
  @apply shadow-lg border-0;
}

.secondary-btn {
  @apply bg-white text-orange-600 border-2 border-orange-200;
  @apply hover:bg-orange-50 hover:border-orange-300;
  @apply px-4 py-2 rounded-lg transition-all duration-200;
}
```

---

## �� Ejemplos de Uso

### Botón Primario
```jsx
<Button className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-6 rounded-lg shadow-lg border-0">
  Confirmar
</Button>
```

### Modal Estándar
```jsx
<DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto mx-4 p-6">
  <DialogHeader className="pb-4">
    <DialogTitle className="text-center text-lg sm:text-xl font-semibold">
      Título del Modal
    </DialogTitle>
    <DialogDescription className="text-center text-sm sm:text-base">
      Descripción del modal
    </DialogDescription>
  </DialogHeader>
  {/* Contenido */}
</DialogContent>
```

### Card con Contenido
```jsx
<Card className="bg-white rounded-lg border border-gray-200 p-4">
  <CardHeader className="pb-4">
    <CardTitle className="text-lg font-semibold text-gray-900">
      Título de la Card
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
</Card>
```

---

*Este design system debe ser seguido consistentemente en toda la aplicación para mantener la coherencia visual y la experiencia de usuario.*