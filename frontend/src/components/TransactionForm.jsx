import React, { useState } from 'react'
import { createTransaction } from '../api'

export default function TransactionForm() {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('SPENDING')
  const [product, setProduct] = useState('')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')
  const [weight, setWeight] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    const payload = {
      type: type,
      amount: amount ? amount.toString() : '0',
      currency: 'UZS',
      product: product,
      source: source,
      description: description,
      weightKg: weight ? weight.toString() : '0'
    }

    try {
      await createTransaction(payload)
      setMsg('✓ Submitted')
      setAmount(''); setProduct(''); setSource(''); setDescription(''); setWeight('')
    } catch (err) {
      setMsg('✗ Error: ' + err.message)
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>Create Transaction</h3>
      <label>Amount (UZS)<input value={amount} onChange={e=>setAmount(e.target.value)} /></label>
      <label>Type
        <select value={type} onChange={e=>setType(e.target.value)}>
          <option value="INCOME">INCOME</option>
          <option value="SPENDING">SPENDING</option>
        </select>
      </label>
      <label>Product<input value={product} onChange={e=>setProduct(e.target.value)} /></label>
      <label>{type === 'INCOME' ? 'Company' : 'Location'}<input value={source} onChange={e=>setSource(e.target.value)} /></label>
      <label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} /></label>
      <label>Weight (kg, optional)<input value={weight} onChange={e=>setWeight(e.target.value)} /></label>
      <button type="submit">Send Request</button>
      <div className="status">{msg}</div>
    </form>
  )
}
