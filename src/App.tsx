/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LandParcelsView } from './components/LandParcelsView';
import { PlantingCalendarView } from './components/PlantingCalendarView';
import { FertilizerManagementView } from './components/FertilizerManagementView';
import { ProductionMonitoringView } from './components/ProductionMonitoringView';
import { LossControlView } from './components/LossControlView';
import { CoordinationAndNotificationsView } from './components/CoordinationAndNotificationsView';
import { OfficialDocumentModal } from './components/OfficialDocumentModal';
import { RoleActionBanner } from './components/RoleActionBanner';

const MainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('lahan');
  const { setShowOfficialModal } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Official Top Bar with Pop-up Sidebar Menu Trigger */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Role Perspective Banner: Operator vs Publik */}
        <RoleActionBanner onNavigateTab={(tab) => setActiveTab(tab)} />

        {/* Data Petani dan Lahan: Identitas kelompok tani, lokasi desa, luas lahan, dan irigasi */}
        {activeTab === 'lahan' && (
          <LandParcelsView />
        )}

        {/* 3. Kalender Tanam: Jadwal tanam, fase pertumbuhan, agroklimat BMKG, dan estimasi panen */}
        {activeTab === 'kalender' && (
          <PlantingCalendarView />
        )}

        {/* 4. Kebutuhan Pupuk: Kebutuhan per poktan dan informasi direktori kios penyalur resmi */}
        {activeTab === 'pupuk' && (
          <FertilizerManagementView />
        )}

        {/* 5. Monitoring Produksi: Luas panen, estimasi ubinan, realisasi tonase, dan produktivitas */}
        {activeTab === 'produksi' && (
          <ProductionMonitoringView />
        )}

        {/* 6. Pengendalian Kehilangan Hasil: Pencatatan kuantitas kehilangan dan evaluasi mekanisasi */}
        {activeTab === 'susut' && (
          <LossControlView />
        )}

        {/* 7. Koordinasi dan Notifikasi: Agenda kegiatan, tindak lanjut pengaduan, dan pesan pemangku */}
        {activeTab === 'koordinasi' && (
          <CoordinationAndNotificationsView />
        )}
      </main>

      {/* Official Document & Print Modal */}
      <OfficialDocumentModal />

      {/* Quiet Government Footer */}
      <footer className="no-print bg-white border-t border-stone-200 py-6 text-xs text-stone-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">SIMPATIS BANGKA</span>
            <span aria-hidden="true">·</span>
            <span>Dinas Pangan dan Pertanian Pemerintah Kabupaten Bangka</span>
            <span aria-hidden="true">·</span>
            <span>Tahun Anggaran 2026</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span>Standar Agroklimat BMKG Babel</span>
            <span>Standar Pupuk & Varietas BSIP Babel</span>
            <button
              onClick={() => setShowOfficialModal(true)}
              className="text-emerald-700 hover:underline cursor-pointer"
            >
              Landasan Kebijakan Perbup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainDashboard />
    </AppProvider>
  );
}

export default App;
