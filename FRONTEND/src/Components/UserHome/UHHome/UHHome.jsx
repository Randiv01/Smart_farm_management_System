// src/Components/UserHome/UHHome/Home.jsx
import React, { useState } from 'react'
import { ShoppingBagIcon } from 'lucide-react'
import Navbar from '../UHNavbar/UHNavbar'
import Footer from '../UHFooter/UHFooter'

const products = [
  { id: 1, name: 'Organic Chicken', category: 'animal' },
  { id: 2, name: 'Free-range Eggs', category: 'animal' },
  { id: 3, name: 'Tomatoes', category: 'plant' },
  { id: 4, name: 'Lettuce', category: 'plant' },
]

const ProductCard = ({ product }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
    <h4 className="font-semibold text-gray-800 dark:text-white">{product.name}</h4>
    <p className="text-gray-600 dark:text-gray-300">{product.category}</p>
  </div>
)

const BulkOrderModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Bulk Order</h2>
        <button onClick={onClose} className="px-4 py-2 bg-green-600 text-white rounded">Close</button>
      </div>
    </div>
  )
}

const Home = () => {
  const [isBulkOrderModalOpen, setIsBulkOrderModalOpen] = useState(false)
  const animalProducts = products.filter(p => p.category === 'animal')
  const plantProducts = products.filter(p => p.category === 'plant')

  return (
    <>
      <Navbar />
      <main className="w-full bg-[#f7e9cb] dark:bg-gray-900 min-h-screen pt-20">
        <section className="text-center py-16 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" }}>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Fresh from Mount Olive Farm – Direct to Your Home</h1>
          <button onClick={() => setIsBulkOrderModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md flex items-center justify-center mx-auto">
            <ShoppingBagIcon className="h-5 w-5 mr-2" /> Shop Bulk
          </button>
        </section>

        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">Our Farm Products</h2>

          <div className="mb-16">
            <h3 className="text-2xl font-semibold mb-6">Animal Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {animalProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6">Plant Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {plantProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </section>

        <BulkOrderModal isOpen={isBulkOrderModalOpen} onClose={() => setIsBulkOrderModalOpen(false)} />
      </main>
      <Footer />
    </>
  )
}

export default Home
