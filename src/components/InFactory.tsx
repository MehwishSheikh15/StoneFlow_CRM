import React, { useState } from 'react';
import { 
  Scissors, 
  ClipboardCheck, 
  Play, 
  CheckSquare, 
  Camera, 
  User, 
  Layers, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Job } from '../types';
import { dbSync as dbMock, STAGES } from '../lib/dbSync';

interface InFactoryProps {
  jobs: Job[];
  onJobSelect: (jobId: string) => void;
  onToast: (msg: string, isWarn?: boolean) => void;
  currentUser: any;
  onAddPhotoClick?: (jobId: string, category: 'qc' | 'site' | 'general') => void;
}

export const InFactory: React.FC<InFactoryProps> = ({
  jobs,
  onJobSelect,
  onToast,
  currentUser,
  onAddPhotoClick
}) => {
  const [activeTab, setActiveTab] = useState<'cutting' | 'qc'>('cutting');
  
  // Interactive QC state variables
  const [qcChecks, setQcChecks] = useState<boolean[]>([false, false, false, false, false]);

  const qcListItems = [
    'Dimensions match layout drawing specifications exactly',
    'Edge profile & surface polish consistent with requested grade',
    'Material verified completely free of chips, cracks, or surface resin gaps',
    'Fitted sink & hob cutouts verified safe against structural template',
    'Slab label photographed and attached to project activity history'
  ];

  // Filters for Factory Queue
  // Cutting station represents Stages 8-11:
  // - Stage 8: Material Reserved (waiting)
  // - Stage 9: Cutting
  // - Stage 10: CNC/Fabrication
  // - Stage 11: Polishing
  const factoryQueueJobs = jobs.filter(j => j.current_stage >= 8 && j.current_stage <= 11);
  
  // QC complete represents Stage 12
  const qcStationJobs = jobs.filter(j => j.current_stage === 12);

  const handleAdvanceStation = async (jobId: string, clientName: string, currentStage: number) => {
    const nextStage = currentStage + 1;
    const res = await dbMock.updateStage(jobId, nextStage, currentUser.id, currentUser.name);
    if (res.success) {
      const nextStageName = STAGES.find(s => s.n === nextStage)?.name || '';
      onToast(`Advanced ${clientName} to Stage ${nextStage} (${nextStageName})`);
    } else {
      onToast(res.error || 'Failed to advance stage', true);
    }
  };

  const handleQCCheck = (idx: number) => {
    const updated = [...qcChecks];
    updated[idx] = !updated[idx];
    setQcChecks(updated);
  };

  const handlePassQC = async (jobId: string, clientName: string) => {
    // Advances to Stage 13: Install Scheduled
    const res = await dbMock.updateStage(jobId, 13, currentUser.id, currentUser.name);
    if (res.success) {
      onToast(`Supervisor QC complete for ${clientName}! Project ready for site installation schedule.`);
      setQcChecks([false, false, false, false, false]);
    } else {
      onToast(res.error || 'QC pass failed', true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-disp font-extrabold text-ink tracking-tight">In Factory</h1>
          <p className="text-xs text-mut mt-1">
            Stages 8–12 • Cutting, Fabrication, CNC, Polishing, and Supervisor Quality Control sign-off
          </p>
        </div>

        {/* Tab Selection Switcher */}
        <div className="bg-soft p-1 rounded-xl flex gap-1 border border-line self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('cutting')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'cutting' 
                ? 'bg-paper text-ink shadow border border-line/30' 
                : 'text-mut hover:text-ink'
            }`}
          >
            <Scissors className="w-4 h-4 text-sap" />
            Cutting Queue ({factoryQueueJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('qc')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'qc' 
                ? 'bg-paper text-ink shadow border border-line/30' 
                : 'text-mut hover:text-ink'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-em" />
            QC Station ({qcStationJobs.length})
          </button>
        </div>
      </div>

      {/* Segment 1: Cutting & Fabrication Queue */}
      {activeTab === 'cutting' && (
        <div className="space-y-4">
          {factoryQueueJobs.length === 0 ? (
            <div className="bg-paper border border-line rounded-2xl p-12 text-center text-sm text-mut">
              No fabrication jobs currently in cutting, fabrication, or polishing.
            </div>
          ) : (
            factoryQueueJobs.map((job) => {
              const stageName = STAGES.find(s => s.n === job.current_stage)?.name || '';
              
              // Custom operators/machines assigned per stage
              let machine = 'Bridge Saw — BS-01';
              let operator = 'Rashid K.';
              let cta = 'Mark Cut Complete';
              
              if (job.current_stage === 8) {
                machine = 'Warehouse Bay A';
                operator = 'Sara M.';
                cta = 'Issue to Cutting';
              } else if (job.current_stage === 10) {
                machine = 'CNC Center — Intermac T3';
                operator = 'Rashid K.';
                cta = 'Mark Fabrication Done';
              } else if (job.current_stage === 11) {
                machine = 'Polishing Station P-02';
                operator = 'Dan P.';
                cta = 'Pass to QC Station';
              }

              return (
                <div 
                  key={job.id}
                  className="bg-paper border border-line rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Visual slab background representation */}
                    <div 
                      className="w-12 h-12 rounded-xl flex-shrink-0 border border-line/30"
                      style={{ 
                        background: job.material === 'Nero Marquina' ? '#26262B' : job.material === 'Calacatta Gold' ? '#E9E2D2' : '#EFEEEA'
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-mut">{job.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.priority === 'urgent' ? 'bg-rubysoft text-ruby' : 'bg-slatesoft text-slate'
                        }`}>
                          {job.priority.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-disp font-bold text-ink mt-1.5 leading-none">
                        {job.client_name}
                      </h3>
                      <p className="text-xs text-mut font-medium mt-1">
                        Slab: {job.material} • Dimensions: 3200 × 1600 mm
                      </p>
                    </div>
                  </div>

                  {/* Operator Details / Machine */}
                  <div className="border-t border-soft md:border-t-0 pt-3 md:pt-0 flex flex-col md:items-end">
                    <span className="text-[9px] uppercase tracking-wider text-mut font-bold">Active Station</span>
                    <span className="text-sm font-disp font-extrabold text-ink mt-0.5">{machine}</span>
                    <span className="text-xs text-mut mt-1 flex items-center gap-1 font-semibold">
                      <User className="w-3.5 h-3.5" />
                      Assigned: {operator}
                    </span>
                  </div>

                  {/* Actions (Glove-friendly, large targets) */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => onJobSelect(job.id)}
                      className="flex-1 md:flex-initial px-5 py-3.5 bg-soft border border-line text-ink font-semibold rounded-xl text-xs hover:border-mut transition-all text-center"
                    >
                      Job Sheet
                    </button>
                    <button
                      onClick={() => handleAdvanceStation(job.id, job.client_name, job.current_stage)}
                      className="flex-grow md:flex-initial px-6 py-3.5 bg-sidebg text-white font-semibold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98] dark:bg-zinc-200 dark:text-black"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {cta}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Segment 2: QC Checklist & Supervisor Station */}
      {activeTab === 'qc' && (
        <div className="space-y-6">
          {qcStationJobs.length === 0 ? (
            <div className="bg-paper border border-line rounded-2xl p-12 text-center text-sm text-mut">
              No jobs currently waiting for Supervisor QC checks.
            </div>
          ) : (
            qcStationJobs.map((job) => {
              const allChecked = qcChecks.every(Boolean);
              const checksRemaining = qcChecks.filter(c => !c).length;

              return (
                <div 
                  key={job.id}
                  className="bg-paper border border-line rounded-2xl p-6 shadow-sm max-w-3xl mx-auto space-y-6"
                >
                  {/* Job Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-soft">
                    <div>
                      <span className="text-[10px] font-bold text-mut">{job.id}</span>
                      <h3 className="text-xl font-disp font-extrabold text-ink mt-1">
                        {job.client_name}
                      </h3>
                      <p className="text-xs text-mut mt-1">
                        QC Station • Slabs: {job.material} • Job type: {job.job_type}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1.5 bg-emsoft text-em rounded-xl border border-em/10">
                      Polishing Complete
                    </span>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">QC Checklists</h4>
                    {qcListItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQCCheck(idx)}
                        className={`w-full flex items-start gap-4 p-3 rounded-xl border text-left transition-all ${
                          qcChecks[idx] 
                            ? 'bg-emsoft/40 border-em/20 text-ink' 
                            : 'bg-paper border-line text-zinc-700 hover:border-mut'
                        }`}
                      >
                        <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                          qcChecks[idx] ? 'bg-em border-em text-white' : 'border-line text-transparent bg-soft'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>
                        <span className={`text-xs leading-relaxed font-semibold ${qcChecks[idx] ? 'line-through text-mut' : ''}`}>
                          {item}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Supervisor Check Tools / Upload Mock & Pass Button */}
                  <div className="pt-4 border-t border-soft flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={() => onAddPhotoClick ? onAddPhotoClick(job.id, 'qc') : onToast('Camera opened on mobile tablet — QC picture logged', false)}
                      className="px-4 py-2.5 bg-soft border border-line rounded-xl text-xs font-semibold text-ink hover:border-mut transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-ink2" />
                      Add QC Photo
                    </button>

                    <div className="flex items-center gap-3">
                      {allChecked ? (
                        <button
                          onClick={() => handlePassQC(job.id, job.client_name)}
                          className="px-5 py-2.5 bg-em text-white font-semibold rounded-xl text-sm hover:opacity-90 shadow flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          Pass QC — Ready to Install
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-mut">
                          {checksRemaining} of 5 checks remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
