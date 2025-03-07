
import { useState, useEffect } from 'react'
import { UserTable } from './UserTable'
import { CreateUserForm } from './CreateNewUser'
import { UserProductivityGraph } from './ProductivityGraph'
import useAxios from '../hooks/useAxios'
import { Navbar } from '../Navbar'

type User = {
  _id: number
  name: string
  username: string
  role: "admin" | "developer"
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('users')
  const Axios = useAxios()

  const [ShowNav, setShowNav] = useState(false);

  const displayNav = () => {
    setShowNav(true);
  };

  const hideNav = () => {
    setShowNav(false);
  };
//on first render fetches from backend to set user data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await Axios.get('/api/projects/1/team')
        // if (!response.ok) {
        //   throw new Error('Failed to fetch users')
        // }
        // const data = await response.json()
        setUsers(response.data)
      } catch {
        setError('Failed to load users. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [Axios])

  const handleUserCreated = (newUser: User) => {
    setUsers([...users, newUser])
    setActiveTab('users')
  }

  const onUserDeleted = (deletedUser: User) => {
    setUsers(users.filter(u => u._id !== deletedUser._id))
  }

  if (loading) return <div className="text-center p-4">Loading...</div>
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>

  return (
    <div className="container mx-auto p-4">
      <div>
        <div className="relative z-10">
          {ShowNav ? <Navbar ShowNav={ShowNav} hideNav={hideNav} /> : null}
        </div>
        <div className="flex items-center justify-between mr-4">
          <svg
            className={"w-10 h-10 md:hidden"}
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={displayNav}
          >
            <path
              d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
              fill="currentColor"
              fill-rule="evenodd"
              clip-rule="evenodd"
            ></path>
          </svg>
          <h1 className="text-4xl font-bold flex items-center justify-center md:justify-start md:items-start w-[80vw] mb-4">Admin Panel</h1>
        </div>
      </div>
      <div className="mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`mr-2 px-4  py-2 rounded ${activeTab === 'add-user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('add-user')}
        >
          Add User
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'productivity' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('productivity')}
        >
          Productivity
        </button>
      </div>
      {activeTab === 'users' && (
        <>
          <UserTable users={users} onUserDeleted={onUserDeleted} />
        </>
      )}
      {activeTab === 'productivity' && (
        <UserProductivityGraph users={users.filter((user) => user.role != "admin")} />
      )}
      {activeTab === 'add-user' && (
        <CreateUserForm onUserCreated={handleUserCreated} />
      )}
    </div>
  )
}
