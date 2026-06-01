import React, { useState } from 'react';
import { Settings, Users, Server, Globe, Shield, Activity, Database, HeartHandshake, ChevronRight, ChevronLeft, Menu, Minus, Maximize2, X } from 'lucide-react';
import { useLanguage } from './hooks/useLanguage';

export default function ServerApp() {
  const { t, lang, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [domain, setDomain] = useState('@exemploinstituicao.co');
  const [users, setUsers] = useState([{ email: 'admin' + domain, role: 'admin' }]);
  const [newUser, setNewUser] = useState('');
  
  // Fake theme state for the server app
  const [theme, setTheme] = useState('light');

  const handleAddUser = () => {
    if (newUser) {
      setUsers([...users, { email: newUser + domain, role: 'user' }]);
      setNewUser('');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex justify-between items-center shadow-sm z-10 drag-region`}>
        <div className="flex items-center gap-3 no-drag">
          <button 
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="bg-[#141414] p-2 rounded-lg hidden sm:block">
            <Server className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold truncate">{t('serverAppTitle')}</h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 no-drag">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as any)}
            className={`p-2 rounded-md border text-sm sm:text-base ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          >
            <option value="pt">{t('portuguese')}</option>
            <option value="en">{t('english')}</option>
            <option value="es">{t('spanish')}</option>
            <option value="zh">{t('chinese')}</option>
          </select>
          
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`p-2 rounded-md border hidden sm:block ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          
          <a 
            href="/app" 
            className="bg-[#141414] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md font-medium hover:bg-black/80 transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            {t('openCommonApp')}
          </a>

          {/* Window Controls (Electron only) */}
          {(window as any).electronAPI && (
            <div className="flex items-center ml-2 border-l border-gray-300 pl-2 gap-1 no-drag">
              <button 
                onClick={() => (window as any).electronAPI.minimize()} 
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => (window as any).electronAPI.maximize()} 
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Maximizar"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => (window as any).electronAPI.close()} 
                className="p-1.5 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside 
          className={`fixed md:relative z-20 h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'} ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}
        >
          <div className="p-4 flex justify-end md:justify-center border-b border-transparent">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 hidden md:block`}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden ${!isSidebarOpen && 'hidden'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className={`flex flex-col gap-2 p-2 overflow-y-auto overflow-x-hidden ${!isSidebarOpen && 'md:items-center'}`}>
            <button 
              onClick={() => { setActiveTab('dashboard'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'dashboard' ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black') : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} ${!isSidebarOpen ? 'justify-center w-12 h-12' : 'w-full'}`}
              title={!isSidebarOpen ? t('dashboard') : undefined}
            >
              <Activity className="w-5 h-5 min-w-[20px]" />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100'}`}>{t('dashboard')}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('domain'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'domain' ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black') : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} ${!isSidebarOpen ? 'justify-center w-12 h-12' : 'w-full'}`}
              title={!isSidebarOpen ? t('domainInstitution') : undefined}
            >
              <Globe className="w-5 h-5 min-w-[20px]" />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100'}`}>{t('domainInstitution')}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('users'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'users' ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black') : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} ${!isSidebarOpen ? 'justify-center w-12 h-12' : 'w-full'}`}
              title={!isSidebarOpen ? t('users') : undefined}
            >
              <Users className="w-5 h-5 min-w-[20px]" />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100'}`}>{t('users')}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('database'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'database' ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black') : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} ${!isSidebarOpen ? 'justify-center w-12 h-12' : 'w-full'}`}
              title={!isSidebarOpen ? t('databaseTab') : undefined}
            >
              <Database className="w-5 h-5 min-w-[20px]" />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100'}`}>{t('databaseTab')}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('settings'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'settings' ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black') : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} ${!isSidebarOpen ? 'justify-center w-12 h-12' : 'w-full'}`}
              title={!isSidebarOpen ? t('serverSettings') : undefined}
            >
              <Settings className="w-5 h-5 min-w-[20px]" />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100'}`}>{t('serverSettings')}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('contribute'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'contribute' ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black') : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} ${!isSidebarOpen ? 'justify-center w-12 h-12' : 'w-full'}`}
              title={!isSidebarOpen ? t('contributeTab') : undefined}
            >
              <HeartHandshake className="w-5 h-5 min-w-[20px]" />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100'}`}>{t('contributeTab')}</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full">
          {activeTab === 'dashboard' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold mb-6">{t('serverStatus')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold">{t('restApi')}</h3>
                  </div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('onlinePort')}</p>
                </div>
                
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold">{t('websockets')}</h3>
                  </div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('activeRealtime')}</p>
                </div>
                
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                    <h3 className="font-semibold">{t('activeUsers')}</h3>
                  </div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>0 {t('connectedNow')}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'domain' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold mb-6">{t('domainConfig')}</h2>
              <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm space-y-4`}>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('institutionDomain')}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className={`flex-1 p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder="@exemploinstituicao.co"
                    />
                    <button className="bg-[#141414] text-white px-6 py-3 rounded-lg font-medium hover:bg-black/80 transition-colors w-full sm:w-auto">
                      {t('save')}
                    </button>
                  </div>
                  <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('domainHelp')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold mb-6">{t('userManagement')}</h2>
              
              <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm space-y-6`}>
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('addNewUser')}</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                      className={`flex-1 p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder={t('userNameExample')}
                    />
                    <div className={`p-3 rounded-lg border flex items-center justify-center sm:justify-start ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                      {domain}
                    </div>
                    <button 
                      onClick={handleAddUser}
                      className="bg-[#141414] text-white px-6 py-3 rounded-lg font-medium hover:bg-black/80 transition-colors w-full sm:w-auto"
                    >
                      {t('add')}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('registeredUsers')}</h3>
                  <div className={`border rounded-lg overflow-x-auto ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <table className="w-full text-left min-w-[400px]">
                      <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th className="p-3 font-medium">{t('email')}</th>
                          <th className="p-3 font-medium">{t('permission')}</th>
                          <th className="p-3 font-medium">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((u, i) => (
                          <tr key={i}>
                            <td className="p-3">{u.email}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <button className="text-red-500 hover:text-red-700 font-medium text-sm">{t('remove')}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold mb-6">{t('serverSettings')}</h2>
              <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm space-y-4`}>
                
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                  <div>
                    <h4 className="font-semibold">{t('serverPort')}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('serverPortHelp')}</p>
                  </div>
                  <input type="number" value="3000" disabled className={`w-24 p-2 rounded border text-center ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`} />
                </div>

                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                  <div>
                    <h4 className="font-semibold">{t('mandatoryAuth')}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('mandatoryAuthHelp')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#141414]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-semibold">{t('autoBackup')}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('autoBackupHelp')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#141414]"></div>
                  </label>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold mb-6">{t('databaseTab')}</h2>
              <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm space-y-4`}>
                <div className="flex items-center gap-4 mb-4">
                  <Database className="w-8 h-8 text-gray-800 dark:text-gray-200" />
                  <div>
                    <h3 className="font-semibold text-lg">{t('localSqlite')}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('defaultStorage')}</p>
                  </div>
                </div>
                <div className={`p-4 rounded-lg bg-gray-100 dark:bg-gray-700 font-mono text-sm break-all`}>
                  /app/data/brmodelo.sqlite3
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <button className="bg-[#141414] text-white px-4 py-2 rounded-lg font-medium hover:bg-black/80 transition-colors w-full sm:w-auto">
                    {t('makeBackup')}
                  </button>
                  <button className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto">
                    {t('restore')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contribute' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold mb-6">{t('contributeTitle')}</h2>
              
              <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-8 rounded-xl border shadow-sm space-y-8`}>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('contributeIntro')}
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full h-fit">
                      <Shield className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{t('contributeStep1')}</h3>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('contributeStep1Desc')}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full h-fit">
                      <Activity className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{t('contributeStep2')}</h3>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('contributeStep2Desc')}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full h-fit">
                      <Globe className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{t('contributeStep3')}</h3>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('contributeStep3Desc')}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full h-fit">
                      <Database className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{t('contributeStep4')}</h3>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('contributeStep4Desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
