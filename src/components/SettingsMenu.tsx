import React, { useState } from 'react';
import { Settings, X, Globe, Palette, Folder, Cloud, Server, Database } from 'lucide-react';
import { Language } from '../i18n';
import { useLanguage } from '../hooks/useLanguage';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAutosaveEnabled: boolean;
  setIsAutosaveEnabled: (enabled: boolean) => void;
  autosaveInterval: number;
  setAutosaveInterval: (interval: number) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
  isOpen, 
  onClose,
  isAutosaveEnabled,
  setIsAutosaveEnabled,
  autosaveInterval,
  setAutosaveInterval
}) => {
  const { lang, setLang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'general' | 'storage' | 'advanced'>('general');
  const [storageType, setStorageType] = useState<'local' | 'cloud' | 'institutional'>('local');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[500px] shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('settings')}
          </h2>
          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-50 border-r p-2 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 p-2 rounded text-sm font-medium ${activeTab === 'general' ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <Globe className="w-4 h-4" /> Geral
            </button>
            <button 
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2 p-2 rounded text-sm font-medium ${activeTab === 'storage' ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <Folder className="w-4 h-4" /> Armazenamento
            </button>
            <button 
              onClick={() => setActiveTab('advanced')}
              className={`flex items-center gap-2 p-2 rounded text-sm font-medium ${activeTab === 'advanced' ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <Server className="w-4 h-4" /> Avançado
            </button>
          </div>

          {/* Content */}
          <div className="w-2/3 p-4 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> {t('language')}
                  </label>
                  <select 
                    value={lang} 
                    onChange={(e) => setLang(e.target.value as Language)}
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="pt">{t('portuguese')}</option>
                    <option value="en">{t('english')}</option>
                    <option value="es">{t('spanish')}</option>
                    <option value="zh">{t('chinese')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Tema
                  </label>
                  <select className="w-full border rounded p-2 text-sm">
                    <option value="light">Claro</option>
                    <option value="dark">Escuro (Em breve)</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>
                <div className="border-t pt-4">
                  <label className="block text-sm font-bold mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Database className="w-4 h-4" /> Salvamento Automático
                    </span>
                    <input 
                      type="checkbox" 
                      checked={isAutosaveEnabled} 
                      onChange={(e) => setIsAutosaveEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#141414]"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Evita perda de dados salvando periodicamente no navegador.</p>
                  
                  {isAutosaveEnabled && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Intervalo (segundos)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="5" 
                          max="300" 
                          step="5"
                          value={autosaveInterval}
                          onChange={(e) => setAutosaveInterval(parseInt(e.target.value))}
                          className="flex-1 accent-[#141414]"
                        />
                        <span className="text-sm font-mono w-12 text-right">{autosaveInterval}s</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="storageType" 
                      value="local" 
                      checked={storageType === 'local'} 
                      onChange={() => setStorageType('local')} 
                      className="accent-[#141414]"
                    />
                    <span className="text-sm font-medium">Local</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="storageType" 
                      value="cloud" 
                      checked={storageType === 'cloud'} 
                      onChange={() => setStorageType('cloud')} 
                      className="accent-[#141414]"
                    />
                    <span className="text-sm font-medium">Nuvem</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="storageType" 
                      value="institutional" 
                      checked={storageType === 'institutional'} 
                      onChange={() => setStorageType('institutional')} 
                      className="accent-[#141414]"
                    />
                    <span className="text-sm font-medium">Institucional</span>
                  </label>
                </div>

                {storageType === 'local' && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <label className="block text-sm font-bold mb-1 flex items-center gap-2">
                      <Folder className="w-4 h-4" /> Pasta Local
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Salvar projetos na pasta brModeloR do sistema.</p>
                    <button className="w-full border border-gray-300 bg-white rounded p-2 text-sm hover:bg-gray-100 font-medium">
                      Selecionar Diretório
                    </button>
                  </div>
                )}

                {storageType === 'cloud' && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <label className="block text-sm font-bold mb-1 flex items-center gap-2">
                      <Cloud className="w-4 h-4" /> Nuvem
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Sincronize seus projetos com serviços de armazenamento em nuvem.</p>
                    <div className="space-y-2">
                      <button className="w-full border border-blue-200 bg-blue-50 text-blue-700 rounded p-2 text-sm hover:bg-blue-100 font-medium flex items-center justify-center gap-2 transition-colors">
                        Conectar Google Drive
                      </button>
                      <button className="w-full border border-sky-200 bg-sky-50 text-sky-700 rounded p-2 text-sm hover:bg-sky-100 font-medium flex items-center justify-center gap-2 transition-colors">
                        Conectar OneDrive
                      </button>
                      <button className="w-full border border-indigo-200 bg-indigo-50 text-indigo-700 rounded p-2 text-sm hover:bg-indigo-100 font-medium flex items-center justify-center gap-2 transition-colors">
                        Conectar Dropbox
                      </button>
                    </div>
                  </div>
                )}

                {storageType === 'institutional' && (
                  <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                    <div>
                      <label className="block text-sm font-bold mb-1 flex items-center gap-2">
                        <Server className="w-4 h-4" /> Servidor Institucional
                      </label>
                      <p className="text-xs text-gray-500 mb-2">Conecte-se ao servidor da sua empresa ou universidade.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">URL do Servidor</label>
                      <input type="text" placeholder="aqui-sua-instituicao.com" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-black outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">E-mail Institucional</label>
                      <input type="email" placeholder="usuario@instituicao.com" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-black outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Senha / Token</label>
                      <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-black outline-none" />
                    </div>
                    <button className="w-full bg-[#141414] text-white rounded p-2 text-sm hover:bg-black font-medium transition-colors mt-2">
                      Autenticar e Conectar
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1 flex items-center gap-2">
                    <Server className="w-4 h-4" /> Servidor Local / Docker
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Configurar conexão com backend para hospedagem própria.</p>
                  <input type="text" placeholder="http://localhost:3000" className="w-full border rounded p-2 text-sm mb-2" />
                  <button className="w-full bg-[#141414] text-white rounded p-2 text-sm hover:bg-[#333] font-medium">
                    Testar Conexão
                  </button>
                </div>
                <div className="border-t pt-4">
                  <label className="block text-sm font-bold mb-1 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Sistema de Versões
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Atualizações Rolling Release.</p>
                  <button className="w-full border border-gray-300 rounded p-2 text-sm hover:bg-gray-50 font-medium">
                    Ver Changelog
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
