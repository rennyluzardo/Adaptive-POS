import React from 'react';
import type { UISchema } from '../../../types/ui-schema';

interface ComponentRendererProps {
  uiSchema: UISchema;
}

type ComponentMap = Record<string, React.ComponentType<any>>;

class ComponentRegistry {
  private components: ComponentMap = {};

  register(name: string, component: React.ComponentType<any>): void {
    this.components[name] = component;
  }

  get(name: string): React.ComponentType<any> | null {
    return this.components[name] || null;
  }

  has(name: string): boolean {
    return name in this.components;
  }

  listRegistered(): string[] {
    return Object.keys(this.components);
  }
}

const registry = new ComponentRegistry();

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({ uiSchema }) => {
  const Component = registry.get(uiSchema.component);

  if (!Component) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Componente no encontrado: {uiSchema.component}</p>
      </div>
    );
  }

  return <Component {...uiSchema.props} />;
};

export { registry };
