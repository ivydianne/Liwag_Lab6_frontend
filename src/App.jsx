import { useEffect, useState } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8087'
const API_URL = `${API_BASE_URL}/api/products`
const LOGIN_URL = `${API_BASE_URL}/api/login`
const REGISTER_URL = `${API_BASE_URL}/api/register`
const emptyForm = { product_name: '', description: '', price: '', quantity: '' }

function LoginScreen({ onLogin, onCreateAccount, notice }) {
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'password' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(LOGIN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Login failed.')
      onLogin(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally { setLoading(false) }
  }

  return (
    <main className="login-shell">
      <section className="login-visual"><img src={heroImg} alt="Layered product platform illustration" /><p className="visual-caption">A clear home for every product in your catalog.</p></section>
      <section className="login-panel">
        <p className="eyebrow">Product Management</p><h1>Welcome<br /><em>Ganda!</em></h1><p className="lede">Sign in to manage your product catalog.</p>
        <form className="login-form" onSubmit={submit}>
          <label>Username<input value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} autoComplete="username" required /></label>
          <label>Password<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} autoComplete="current-password" required /></label>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'} <span>↗</span></button>
        </form>
        {notice && <div className="success-message" role="status">{notice}</div>}
        <button className="account-link" type="button" onClick={onCreateAccount}>Create New User Account</button>
        <p className="demo-note">Admin account: admin / password</p>
        <p className="demo-note">User account: Ivy_dianne / IvyRL111</p>
      </section>
    </main>
  )
}

function RegisterScreen({ onBack, onRegistered }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not create account.')
      onRegistered(result.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally { setLoading(false) }
  }

  return (
    <main className="login-shell">
      <section className="login-visual"><img src={heroImg} alt="Layered product platform illustration" /><p className="visual-caption">Create an account to view the product catalog.</p></section>
      <section className="login-panel">
        <button className="text-button back-login" type="button" onClick={onBack}>← Back to login</button>
        <p className="eyebrow">New account</p><h1>Create<br /><em>account.</em></h1><p className="lede">New accounts can view products after signing in.</p>
        <form className="login-form" onSubmit={submit}>
          <label>Username<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="username" required /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label>
          <label>Password<input type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" required /></label>
          <label>Confirm password<input type="password" minLength="8" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} autoComplete="new-password" required /></label>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'} <span>↗</span></button>
        </form>
      </section>
    </main>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [view, setView] = useState('products')
  const [authMode, setAuthMode] = useState('login')
  const [notice, setNotice] = useState('')
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem('product_auth') || 'null'))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(API_URL, { headers: { Authorization: `Bearer ${auth?.tokens?.access_token ?? ''}` } })
      if (!response.ok) throw new Error('Could not load products.')
      const result = await response.json()
      setProducts(result.data ?? [])
    } catch (requestError) {
      setError(`${requestError.message} Check that the LavaLust server is running on port 8087.`)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (auth?.tokens?.access_token) loadProducts() }, [auth])

  if (!auth?.tokens?.access_token) {
    if (authMode === 'register') {
      return <RegisterScreen onBack={() => setAuthMode('login')} onRegistered={(message) => { setNotice(message); setAuthMode('login') }} />
    }
    return <LoginScreen notice={notice} onCreateAccount={() => { setNotice(''); setAuthMode('register') }} onLogin={(result) => { localStorage.setItem('product_auth', JSON.stringify(result)); setAuth(result) }} />
  }

  const apiHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.tokens.access_token}` }
  const isAdmin = auth.user.role === 'admin'
  const handleChange = (event) => { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value })) }
  const resetForm = () => { setForm(emptyForm); setEditingId(null) }

  const handleSubmit = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    const payload = { product_name: form.product_name, description: form.description, price: Number(form.price), quantity: Number(form.quantity) }
    try {
      const response = await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, { method: editingId ? 'PATCH' : 'POST', headers: apiHeaders, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not save product.')
      resetForm(); setView('products'); await loadProducts()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  const editProduct = (product) => {
    setEditingId(product.id); setView('add')
    setForm({ product_name: product.product_name, description: product.description ?? '', price: product.price, quantity: product.quantity })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    setError('')
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: apiHeaders })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not delete product.')
      await loadProducts()
    } catch (requestError) { setError(requestError.message) }
  }

  const logout = () => { localStorage.removeItem('product_auth'); setAuth(null) }

  return (
    <main className="app-shell">
      <header className="topbar"><a className="brand" href="/"><span className="brand-mark">PM</span><span>Product Management</span></a><div className="heading-actions"><span className="status"><i /> {auth.user.username}</span><button className="logout-button" type="button" onClick={logout}>Log out</button></div></header>
      <section className="hero-copy"><h1>Keep your products<br /><em>in motion.</em></h1><p className="lede">A focused workspace for the products that keep your business moving.</p></section>
      <section className="workspace">
        {view === 'products' ? <>
          <div className="list-heading"><h2>All Products</h2><div className="heading-actions">{isAdmin && <button className="primary-button add-products-button" type="button" onClick={() => { resetForm(); setView('add') }}>Add Product <span>↗</span></button>}<button className="refresh-button" type="button" onClick={loadProducts}>↻ <span>Refresh</span></button></div></div>
          {loading ? <p className="empty-state">Loading products...</p> : products.length === 0 ? <p className="empty-state">No products yet.</p> : <div className="product-list">{products.map((product) => <article className="product-row" key={product.id}><div className="product-index">{String(product.id).padStart(2, '0')}</div><div className="product-info"><h3>{product.product_name}</h3><p>{product.description || 'No description'}</p></div><div className="product-price">Php{Number(product.price).toFixed(2)}</div><div className="product-quantity">{product.quantity} units</div>{isAdmin && <div className="row-actions"><button type="button" onClick={() => editProduct(product)}>Edit</button><button type="button" className="danger" onClick={() => deleteProduct(product.id)}>Delete</button></div>}</article>)}</div>}
        </> : isAdmin ? <>
          <div className="section-heading add-product-heading"><h2>{editingId ? 'Edit Product' : 'Add a Product'}</h2><button className="text-button" type="button" onClick={() => { resetForm(); setView('products') }}>← Back to All Products</button></div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <form className="product-form" onSubmit={handleSubmit}><label>Product name<input name="product_name" value={form.product_name} onChange={handleChange} placeholder="e.g. Ceramic mug" required maxLength="100" /></label><label>Description<textarea name="description" value={form.description} onChange={handleChange} placeholder="Short description" rows="3" /></label><label>Price<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" required /></label><label>Quantity<input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={handleChange} placeholder="0" required /></label><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update product' : 'Add product'} <span>↗</span></button></form>
        </> : null}
      </section>
    </main>
  )
}

export default App
