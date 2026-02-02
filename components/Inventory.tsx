import React, { useState, useEffect } from 'react';
import { Product, Stylist } from '../types';
import { MOCK_CATALOG, SUPPLIERS } from '../constants';
import { Package, Search, Plus, Download, ShoppingBag, ArrowRight, Globe, Loader2, X, Save, DollarSign, Tag } from 'lucide-react';

interface InventoryProps {
  currentUser: Stylist | 'OWNER';
  inventory: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
}

interface CatalogItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  imageUrl?: string;
}

const Inventory: React.FC<InventoryProps> = ({ currentUser, inventory, onAddProduct, onUpdateProduct }) => {
  const [viewMode, setViewMode] = useState<'MY_INVENTORY' | 'CATALOG'>('MY_INVENTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  
  // API State
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<{ stock: string, price: string, cost: string }>({ stock: '', price: '', cost: '' });

  // Add Item State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
      name: '',
      brand: '',
      category: '',
      price: '',
      cost: '',
      stock: ''
  });

  // Filter My Inventory
  const myProducts = inventory.filter(p => {
      if (currentUser === 'OWNER') return true;
      return p.stylistId === currentUser.id;
  }).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

  // Open Beauty Facts API Search
  useEffect(() => {
    if (viewMode === 'CATALOG' && searchQuery.length > 2) {
        const timer = setTimeout(async () => {
            setIsApiLoading(true);
            try {
                const response = await fetch(`https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=24`);
                const data = await response.json();
                
                if (data.products) {
                    const mappedProducts: Product[] = data.products.map((p: any) => ({
                        id: p.code || Math.random().toString(36),
                        name: p.product_name || 'Unknown Product',
                        brand: p.brands || 'Unknown Brand',
                        category: p.categories ? p.categories.split(',')[0] : 'General',
                        price: 0, // API doesn't provide price
                        stock: 0,
                        stylistId: '',
                        imageUrl: p.image_front_small_url
                    }));
                    setApiProducts(mappedProducts);
                }
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setIsApiLoading(false);
            }
        }, 500); // Debounce
        
        return () => clearTimeout(timer);
    } else {
        setApiProducts([]);
    }
  }, [searchQuery, viewMode]);

  // Determine which catalog to show
  const displayCatalog = (viewMode === 'CATALOG' && searchQuery.length > 2) 
      ? apiProducts 
      : MOCK_CATALOG.filter(p => {
          if (selectedSupplier !== 'All' && selectedSupplier !== 'Direct from Brand') return true;
          return true;
      }).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleImport = (catalogItem: CatalogItem) => {
    const newProduct: Product = {
        id: `prod-${Math.random().toString(36).substr(2, 9)}`,
        name: catalogItem.name,
        brand: catalogItem.brand,
        category: catalogItem.category,
        price: catalogItem.price || 0,
        cost: 0,
        stock: 0,
        stylistId: currentUser === 'OWNER' ? '1' : currentUser.id,
        imageUrl: catalogItem.imageUrl
    };
    onAddProduct(newProduct);
  };

  const handleEditClick = (product: Product) => {
      setEditingProduct(product);
      setEditForm({
          stock: product.stock.toString(),
          price: product.price.toString(),
          cost: (product.cost || 0).toString()
      });
  };

  const handleSaveEdit = () => {
      if (!editingProduct) return;
      onUpdateProduct({
          ...editingProduct,
          stock: parseInt(editForm.stock) || 0,
          price: parseFloat(editForm.price) || 0,
          cost: parseFloat(editForm.cost) || 0
      });
      setEditingProduct(null);
  };

  const handleSaveNewProduct = () => {
    if (!newProductForm.name || !newProductForm.brand) return;

    const newProduct: Product = {
        id: `prod-${Math.random().toString(36).substr(2, 9)}`,
        name: newProductForm.name,
        brand: newProductForm.brand,
        category: newProductForm.category || 'General',
        price: parseFloat(newProductForm.price) || 0,
        cost: parseFloat(newProductForm.cost) || 0,
        stock: parseInt(newProductForm.stock) || 0,
        stylistId: currentUser === 'OWNER' ? '1' : currentUser.id,
    };
    onAddProduct(newProduct);
    setIsAddModalOpen(false);
    setNewProductForm({
        name: '',
        brand: '',
        category: '',
        price: '',
        cost: '',
        stock: ''
    });
  };

  const isAlreadyInInventory = (productName: string) => {
      return myProducts.some(p => p.name.toLowerCase() === productName.toLowerCase());
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <Package className="w-6 h-6 text-emerald-600" />
                    Inventory Management
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                    {currentUser === 'OWNER' ? 'Manage salon-wide stock and supplier catalogs' : 'Manage your personal retail stock'}
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
                 <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Item
                </button>

                <div className="flex bg-stone-100 p-1 rounded-lg">
                    <button 
                        onClick={() => { setViewMode('MY_INVENTORY'); setSearchQuery(''); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'MY_INVENTORY' ? 'bg-white shadow text-emerald-600' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        My Inventory
                    </button>
                    <button 
                        onClick={() => { setViewMode('CATALOG'); setSearchQuery(''); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'CATALOG' ? 'bg-white shadow text-emerald-600' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        Browse Catalogs
                    </button>
                </div>
            </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder={viewMode === 'MY_INVENTORY' ? "Search your stock..." : "Search Global Beauty Database..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                />
                {isApiLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    </div>
                )}
            </div>
            
            {viewMode === 'CATALOG' && searchQuery.length <= 2 && (
                <div className="w-full md:w-64">
                    <select 
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="w-full h-full px-4 py-3 rounded-xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="All">All Suppliers</option>
                        {SUPPLIERS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
            )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {viewMode === 'MY_INVENTORY' ? (
                <>
                    {myProducts.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-stone-400">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold text-stone-600">No products found</h3>
                            <p className="mb-6">You haven't added any products to your inventory yet.</p>
                            <button onClick={() => setViewMode('CATALOG')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                                Browse Supplier Catalog
                            </button>
                        </div>
                    ) : (
                        myProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-32 bg-stone-100 flex items-center justify-center relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Package className="w-10 h-10 text-stone-300" />
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                                        ${product.price.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="text-xs text-emerald-600 font-semibold mb-1 truncate" title={product.brand}>{product.brand}</div>
                                    <h3 className="font-bold text-stone-800 text-sm mb-1 truncate" title={product.name}>{product.name}</h3>
                                    <div className="text-xs text-stone-500 mb-4 truncate">{product.category}</div>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                                        <div className="text-xs text-stone-500">
                                            Stock: <span className="font-bold text-stone-900">{product.stock || 0}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleEditClick(product)}
                                            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </>
            ) : (
                // CATALOG VIEW
                <>
                    {displayCatalog.length === 0 && !isApiLoading && (
                        <div className="col-span-full py-12 text-center text-stone-400">
                            <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Enter search terms to find products from the global database...</p>
                        </div>
                    )}
                    
                    {displayCatalog.map(item => {
                        const added = isAlreadyInInventory(item.name);
                        return (
                            <div key={item.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all group">
                                <div className="h-40 bg-white flex items-center justify-center relative p-4 border-b border-stone-100">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <div className="font-bold text-stone-400 text-xl tracking-widest uppercase opacity-30">{item.brand}</div>
                                        </div>
                                    )}
                                    {/* Mock Supplier Badge if not API */}
                                    {!item.imageUrl && (
                                        <div className="absolute bottom-2 left-2 flex gap-1">
                                            {SUPPLIERS.slice(0, Math.floor(Math.random() * 2) + 1).map((s, i) => (
                                                <span key={i} className="bg-black/10 text-[8px] font-bold px-1.5 py-0.5 rounded text-stone-600">{s.logo}</span>
                                            ))}
                                        </div>
                                    )}
                                    {/* API Source Badge */}
                                    {item.imageUrl && (
                                        <div className="absolute top-2 right-2 bg-stone-100 text-[9px] px-1.5 py-0.5 rounded text-stone-500">
                                            Global DB
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="w-full">
                                            <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1 truncate" title={item.brand}>{item.brand}</div>
                                            <h3 className="font-bold text-stone-900 leading-tight mb-1 truncate" title={item.name}>{item.name}</h3>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-stone-500 mb-4 truncate" title={item.category}>{item.category}</p>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-stone-900">
                                            {item.price > 0 ? `$${item.price.toFixed(2)}` : <span className="text-xs text-stone-400 font-normal">Set Price</span>}
                                        </span>
                                        
                                        {added ? (
                                            <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-3 py-2 rounded-lg">
                                                <ShoppingBag className="w-3 h-3" /> Added
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleImport(item)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-emerald-200"
                                            >
                                                <Download className="w-4 h-4" /> Import
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>

        {/* Add Product Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                    <div className="bg-emerald-950 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Add New Item
                        </h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Product Name</label>
                            <input 
                                value={newProductForm.name}
                                onChange={e => setNewProductForm({...newProductForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900"
                                placeholder="e.g. Daily Shampoo"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Brand</label>
                                <input 
                                    value={newProductForm.brand}
                                    onChange={e => setNewProductForm({...newProductForm, brand: e.target.value})}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900"
                                    placeholder="e.g. Redken"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Category</label>
                                <input 
                                    value={newProductForm.category}
                                    onChange={e => setNewProductForm({...newProductForm, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900"
                                    placeholder="e.g. Shampoo"
                                />
                             </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Quantity (Stock)</label>
                            <input 
                                type="number"
                                min="0"
                                value={newProductForm.stock}
                                onChange={e => setNewProductForm({...newProductForm, stock: e.target.value})}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Cost (Wholesale)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newProductForm.cost}
                                        onChange={e => setNewProductForm({...newProductForm, cost: e.target.value})}
                                        className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">MSRP (Retail)</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newProductForm.price}
                                        onChange={e => setNewProductForm({...newProductForm, price: e.target.value})}
                                        className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900" 
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveNewProduct}
                            disabled={!newProductForm.name || !newProductForm.brand}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-bold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Add Product
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                    <div className="bg-emerald-950 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <Package className="w-5 h-5" /> Edit Product
                        </h3>
                        <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 mb-4">
                            <div className="text-xs font-bold text-stone-500 uppercase">{editingProduct.brand}</div>
                            <div className="font-bold text-stone-800">{editingProduct.name}</div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Quantity (Stock)</label>
                            <input 
                                type="number"
                                min="0"
                                value={editForm.stock}
                                onChange={e => setEditForm({...editForm, stock: e.target.value})}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Cost (Wholesale)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editForm.cost}
                                        onChange={e => setEditForm({...editForm, cost: e.target.value})}
                                        className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">MSRP (Retail)</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editForm.price}
                                        onChange={e => setEditForm({...editForm, price: e.target.value})}
                                        className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900" 
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveEdit}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Inventory;