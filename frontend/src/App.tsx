import { useState } from 'react';
import { ComponentRenderer, registry } from './components/generative/core/ComponentRenderer';
import ProductCatalog from './components/generative/catalog/ProductCatalog';
import ShoppingCart from './components/generative/cart/ShoppingCart';
import SimpleMessage from './components/generative/messages/SimpleMessage';
import SkeletonLoader from './components/generative/core/SkeletonLoader';
import type { AgentState } from './types/ui-schema';

// Register components
registry.register('ProductCatalog', ProductCatalog);
registry.register('ShoppingCart', ShoppingCart);
registry.register('SimpleMessage', SimpleMessage);
registry.register('ErrorComponent', SimpleMessage);

function App() {
  const [input, setInput] = useState('');
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setAgentState(null);

    try {
      const response = await fetch('http://localhost:3000/agent/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data: AgentState = await response.json();
      setAgentState(data);
    } catch (error) {
      console.error('Error communicating with agent:', error);
      setAgentState({
        messages: [{ role: 'error', content: 'Error de comunicación con el servidor' }],
        currentStep: 'error',
        uiSchema: {
          component: 'ErrorComponent',
          props: { text: 'Error de comunicación', type: 'warning' },
          status: 'error',
        },
      });
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Adaptive POS</h1>
          <p className="text-gray-600">Sistema de Punto de Venta con Generative UI</p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu solicitud (ej: 'Quiero ver el catálogo de productos')"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Procesando...' : 'Enviar'}
            </button>
          </div>
        </form>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px]">
          {isLoading && <SkeletonLoader />}
          
          {!isLoading && agentState?.uiSchema && agentState?.uiSchema?.component && (
            <div className="p-6">
              <ComponentRenderer uiSchema={agentState.uiSchema} />
            </div>
          )}

          {!isLoading && agentState?.uiSchema && !agentState?.uiSchema?.component && (
            <div className="p-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">uiSchema recibido pero sin component: {JSON.stringify(agentState.uiSchema)}</p>
              </div>
            </div>
          )}
          
          {!isLoading && !agentState && (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                El sistema está listo. Escribe una solicitud para comenzar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
