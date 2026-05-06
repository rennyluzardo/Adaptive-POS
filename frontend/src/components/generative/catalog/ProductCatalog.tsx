import React from 'react';
import type { ProductCatalogProps, ProductItem } from '../../../types/ui-schema';

const ProductCatalog: React.FC<ProductCatalogProps> = ({ items }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Catálogo de Productos</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: ProductItem) => {
            const isOutOfStock = item.stock === 0;
            return (
              <div
                key={item.id}
                className={`p-4 bg-gray-50 rounded-lg border transition-colors ${
                  isOutOfStock
                    ? 'border-gray-200 opacity-60'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  {isOutOfStock && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                      Agotado
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className={`text-sm ${isOutOfStock ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    Stock: {item.stock}
                  </span>
                </div>
                {isOutOfStock && (
                  <button
                    disabled
                    className="mt-3 w-full px-4 py-2 bg-gray-200 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    No disponible
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;
