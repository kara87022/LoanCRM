// Moved Collections.js to Collections module
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loans, setLoans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    loan_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCollections();
    fetchLoans();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/collections');
      setCollections(response.data);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/loans');
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:4000/api/collections', formData);
      setFormData({
        loan_id: '',
        date: new Date().toISOString().split('T')[0],
        amount: ''
      });
      setShowForm(false);
      fetchCollections();
      alert('Collection recorded successfully!');
    } catch (error) {
      alert('Error recording collection: ' + error.response?.data?.error);
    }
    setLoading(false);
  };

  const getLoanDetails = (loanId) => {
    return loans.find(loan => loan.loan_id === loanId);
  };

  const filteredCollections = collections.filter(collection => {
    const loan = getLoanDetails(collection.loan_id);
    return collection.loan_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           loan?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCollected = collections.reduce((sum, col) => sum + (col.amount || 0), 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Collections Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : 'Record Collection'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Collections</h3>
          <p className="text-3xl font-bold text-green-600">{collections.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Amount Collected</h3>
          <p className="text-3xl font-bold text-blue-600">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Today's Collections</h3>
          <p className="text-3xl font-bold text-purple-600">
            {collections.filter(c => c.date === new Date().toISOString().split('T')[0]).length}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by loan ID or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Record New Collection</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan ID</label>
              <select
                value={formData.loan_id}
                onChange={(e) => setFormData({...formData, loan_id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Loan</option>
                {loans.map(loan => (
                  <option key={loan.loan_id} value={loan.loan_id}>
                    {loan.loan_id} - {loan.customer_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Recording...' : 'Record Collection'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">All Collections ({filteredCollections.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCollections.map((collection) => {
                const loan = getLoanDetails(collection.loan_id);
                return (
                  <tr key={collection.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{collection.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{collection.loan_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loan?.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{collection.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{collection.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Collected
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Collections;