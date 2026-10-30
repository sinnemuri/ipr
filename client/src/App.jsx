import { useEffect, useState } from 'react'
import api from './api/axios'
import './App.css'

const EMPTY_MEME = {
  title: '',
  imageUrl: '',
  description: '',
  categoryId: '',
}

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('memehub.user') || 'null')
  } catch {
    sessionStorage.removeItem('memehub.user')
    return null
  }
}

function getErrorMessage(error) {
  return error.response?.data?.error || error.message || 'Не удалось выполнить запрос'
}

function App() {
  const [user, setUser] = useState(getStoredUser)
  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '' })
  const [registerMode, setRegisterMode] = useState(false)
  const [categories, setCategories] = useState([])
  const [memes, setMemes] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingMeme, setEditingMeme] = useState(null)
  const [memeForm, setMemeForm] = useState(EMPTY_MEME)
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    let cancelled = false

    api.get('/categories')
      .then(({ data }) => {
        if (!cancelled) setCategories(data.categories)
      })
      .catch((requestError) => {
        if (!cancelled) setError(getErrorMessage(requestError))
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    api.get('/memes', {
      params: {
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
      },
    })
      .then(({ data }) => {
        if (cancelled) return
        setMemes((current) => page === 1 ? data.memes : [...current, ...data.memes])
        setPages(data.pagination.pages)
      })
      .catch((requestError) => {
        if (!cancelled) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch, categoryId, refreshVersion])

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    try {
      if (registerMode) {
        await api.post('/auth/register', authForm)
        setRegisterMode(false)
        setNotice('Аккаунт создан. Теперь войдите в MemeHub.')
        return
      }

      const { data } = await api.post('/auth/login', {
        email: authForm.email,
        password: authForm.password,
      })
      sessionStorage.setItem('memehub.accessToken', data.accessToken)
      sessionStorage.setItem('memehub.user', JSON.stringify(data.user))
      setUser(data.user)
      setAuthForm({ email: data.user.email, username: '', password: '' })
      setNotice(`Вы вошли как ${data.user.username}.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      sessionStorage.removeItem('memehub.accessToken')
      sessionStorage.removeItem('memehub.user')
      setUser(null)
      setNotice('Вы вышли из аккаунта.')
    }
  }

  function startCreate() {
    setEditingMeme(null)
    setMemeForm({ ...EMPTY_MEME, categoryId: categories[0]?.id || '' })
    setFormOpen(true)
    setError('')
  }

  function startEdit(meme) {
    setEditingMeme(meme)
    setMemeForm({
      title: meme.title,
      imageUrl: meme.imageUrl,
      description: meme.description || '',
      categoryId: meme.categoryId,
    })
    setFormOpen(true)
    setError('')
  }

  async function handleMemeSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    const payload = { ...memeForm, categoryId: Number(memeForm.categoryId) }

    try {
      if (editingMeme) {
        await api.put(`/memes/${editingMeme.id}`, payload)
        setNotice('Изменения сохранены.')
      } else {
        await api.post('/memes', payload)
        setNotice('Мем опубликован.')
      }
      setFormOpen(false)
      setEditingMeme(null)
      setPage(1)
      setLoading(true)
      setRefreshVersion((version) => version + 1)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleDelete(meme) {
    if (!window.confirm(`Удалить мем «${meme.title}»?`)) return

    setError('')
    try {
      await api.delete(`/memes/${meme.id}`)
      setNotice('Мем удалён.')
      setPage(1)
      setLoading(true)
      setRefreshVersion((version) => version + 1)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const canEdit = (meme) => user && (
    Number(user.id) === Number(meme.authorId) || user.role === 'admin'
  )

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="MemeHub, главная">
          <span className="brand-mark">M</span>
          <span>MemeHub</span>
        </a>
        <div className="header-account">
          {user ? (
            <>
              <span className="user-label">{user.username}</span>
              <button className="button button-quiet" onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <a className="header-link" href="#account">Войти</a>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">ЛЕНТА ХОРОШЕГО НАСТРОЕНИЯ</span>
          <h1>Мемы, которыми хочется <span>делиться.</span></h1>
          <p>Находи смешное, публикуй своё и собирай любимую коллекцию вместе с MemeHub.</p>
        </div>
        <div className="hero-sticker" aria-hidden="true">
          <span>MEME</span>
          <strong>☺</strong>
          <span>HUB</span>
        </div>
      </section>

      {!user && (
        <section className="account-panel" id="account">
          <div>
            <span className="eyebrow">{registerMode ? 'СОЗДАТЬ АККАУНТ' : 'УЖЕ С НАМИ?'}</span>
            <h2>{registerMode ? 'Присоединяйся к MemeHub' : 'Войди, чтобы публиковать мемы'}</h2>
          </div>
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
              />
            </label>
            {registerMode && (
              <label>
                Имя пользователя
                <input
                  type="text"
                  required
                  minLength="3"
                  maxLength="50"
                  autoComplete="username"
                  value={authForm.username}
                  onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })}
                />
              </label>
            )}
            <label>
              Пароль
              <input
                type="password"
                required
                minLength={registerMode ? 8 : undefined}
                autoComplete={registerMode ? 'new-password' : 'current-password'}
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
              />
            </label>
            <button className="button button-primary" type="submit">
              {registerMode ? 'Создать аккаунт' : 'Войти'}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => setRegisterMode((current) => !current)}
            >
              {registerMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </form>
        </section>
      )}

      {notice && <p className="notice" role="status">{notice}</p>}
      {error && <p className="error-banner" role="alert">{error}</p>}

      <section className="feed-section" aria-labelledby="feed-title">
        <div className="feed-heading">
          <div>
            <span className="eyebrow">СВЕЖЕЕ ИЗ СООБЩЕСТВА</span>
            <h2 id="feed-title">Лента мемов</h2>
          </div>
          {user && (
            <button className="button button-primary" onClick={startCreate}>
              <span aria-hidden="true">＋</span> Добавить мем
            </button>
          )}
        </div>

        <div className="filters">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Найти мем..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setLoading(true)
                setError('')
              }}
              aria-label="Поиск мемов"
            />
          </label>
          <label className="category-filter">
            <span className="sr-only">Категория</span>
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value)
                setPage(1)
                setLoading(true)
                setError('')
              }}
            >
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
        </div>

        {formOpen && (
          <form className="meme-form" onSubmit={handleMemeSubmit}>
            <div className="form-heading">
              <h3>{editingMeme ? 'Редактировать мем' : 'Новый мем'}</h3>
              <button
                type="button"
                className="text-button"
                onClick={() => setFormOpen(false)}
              >
                Закрыть
              </button>
            </div>
            <label>
              Название
              <input
                required
                minLength="2"
                maxLength="120"
                value={memeForm.title}
                onChange={(event) => setMemeForm({ ...memeForm, title: event.target.value })}
              />
            </label>
            <label>
              Ссылка на изображение
              <input
                type="url"
                required
                maxLength="500"
                placeholder="https://example.com/meme.jpg"
                value={memeForm.imageUrl}
                onChange={(event) => setMemeForm({ ...memeForm, imageUrl: event.target.value })}
              />
            </label>
            <label>
              Категория
              <select
                required
                value={memeForm.categoryId}
                onChange={(event) => setMemeForm({ ...memeForm, categoryId: event.target.value })}
              >
                <option value="" disabled>Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              Описание
              <textarea
                maxLength="500"
                rows="3"
                value={memeForm.description}
                onChange={(event) => setMemeForm({ ...memeForm, description: event.target.value })}
              />
            </label>
            <button className="button button-primary" type="submit">
              {editingMeme ? 'Сохранить изменения' : 'Опубликовать'}
            </button>
          </form>
        )}

        {loading && memes.length === 0 && <p className="empty-state">Загружаем мемы...</p>}
        {!loading && memes.length === 0 && (
          <div className="empty-state">
            <span aria-hidden="true">◉</span>
            <h3>Пока ничего не найдено</h3>
            <p>Попробуй изменить запрос или загляни сюда чуть позже.</p>
          </div>
        )}

        <div className="meme-grid">
          {memes.map((meme, index) => (
            <article className="meme-card" key={meme.id}>
              <div className="meme-image-wrap">
                <img
                  src={meme.imageUrl}
                  alt={meme.title}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                {meme.category?.name && <span className="category-pill">{meme.category.name}</span>}
              </div>
              <div className="meme-content">
                <div className="meme-meta">
                  <span>{meme.author?.username || 'Аноним'}</span>
                  {meme.createdAt && (
                    <time dateTime={meme.createdAt}>
                      {new Date(meme.createdAt).toLocaleDateString('ru-RU')}
                    </time>
                  )}
                </div>
                <h3>{meme.title}</h3>
                {meme.description && <p>{meme.description}</p>}
                <div className="meme-card-footer">
                  <span className="likes">♥ {meme.likesCount || 0}</span>
                  {canEdit(meme) && (
                    <div className="card-actions">
                      <button className="text-button" onClick={() => startEdit(meme)}>Изменить</button>
                      {user.role === 'admin' && (
                        <button className="text-button danger-text" onClick={() => handleDelete(meme)}>
                          Удалить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {loading && memes.length > 0 && <p className="loading-more">Загружаем...</p>}
        {!loading && page < pages && (
          <button
            className="button button-secondary load-more"
            onClick={() => {
              setLoading(true)
              setError('')
              setPage((current) => current + 1)
            }}
          >
            Показать ещё
          </button>
        )}
      </section>

      <footer className="site-footer">
        <a className="brand" href="/" aria-label="MemeHub">
          <span className="brand-mark">M</span>
          <span>MemeHub</span>
        </a>
        <span>Делись смешным. Береги хорошее настроение.</span>
      </footer>
    </main>
  )
}

export default App
