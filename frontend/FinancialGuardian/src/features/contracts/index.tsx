import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DropZone } from './components/DropZone'
import { UploadProgress } from './components/UploadProgress'
import { AgentThinking } from './components/AgentThinking'
import { ExtractionResult } from './components/ExtractionResult'
import { ContractList } from './components/ContractList'
import { SpendingCharts } from './components/SpendingCharts'
import { useFileUpload } from './hooks/useFileUpload'
import { useContractExtraction } from './hooks/useContractExtraction'
import { contractApi } from './api'
import type { ExtractedContract, UploadedFile } from './types'


function useOrchestration(
  files: UploadedFile[],
  markDone: (id: string, result: UploadedFile['result']) => void,
  markError: (id: string, error: string) => void,
) {
  const extraction = useContractExtraction()
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeFile,   setActiveFile]   = useState<UploadedFile | null>(null)

  useEffect(() => {
    const next = files.find(f => f.status === 'extracting' && f.fileId)
    if (!next || next.id === activeFileId) return
    setActiveFileId(next.id)
    setActiveFile(next)
    extraction.startStream(next.fileId!)
  }, [files, activeFileId, extraction])

  useEffect(() => {
    if (!activeFileId || extraction.status !== 'done') return
    markDone(activeFileId, extraction.fields as ExtractedContract)
  }, [extraction.status, activeFileId, markDone])

  useEffect(() => {
    if (!activeFileId || extraction.status !== 'error') return
    markError(activeFileId, extraction.error ?? 'Extraction failed')
  }, [extraction.status, activeFileId, extraction.error, markError])

  return { extraction, activeFile }
}


export default function Bills() {
  const upload = useFileUpload()
  const { extraction, activeFile } = useOrchestration(
    upload.files,
    upload.markDone,
    upload.markError,
  )

  const [refreshKey,   setRefreshKey]   = useState(0)
  const [reviewTarget, setReviewTarget] = useState<UploadedFile | null>(null)

  useEffect(() => {
    const done = upload.files.find(f => f.status === 'done' && f.result && !reviewTarget)
    if (done) setReviewTarget(done)
  }, [upload.files, reviewTarget])

  const handleSave = async (contract: Partial<ExtractedContract>) => {
    await contractApi.save(contract as ExtractedContract)
    setRefreshKey(k => k + 1)
    setReviewTarget(null)
    upload.clearAll()
    extraction.reset()
  }

  const handleDiscard = () => {
    setReviewTarget(null)
    upload.clearAll()
    extraction.reset()
  }

  const showStream = extraction.status === 'streaming' || extraction.status === 'done'

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white p-6 lg:p-8">

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-teal-500/4 blur-[140px]" />
      </div>

      <div className="relative max-w-3xl mx-auto space-y-8">

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
              </svg>
            </div>
            <span className="text-white/40 text-[12px] font-medium uppercase tracking-widest">Guardian</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight">
            Bills<span className="text-teal-400">.</span>
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">
            Upload contracts — guardian extracts your obligations and tracks spending
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!reviewTarget ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <DropZone
                onFiles={upload.addFiles}
                disabled={upload.isUploading || upload.isExtracting}
              />

              <UploadProgress
                files={upload.files}
                onRemove={upload.removeFile}
              />

              {upload.hasIdle && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={upload.uploadAll}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-[13.5px] font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
                    </svg>
                    Scan bills
                  </motion.button>
                </motion.div>
              )}

              <AnimatePresence>
                {showStream && activeFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AgentThinking
                      thinking={extraction.thinking}
                      fields={extraction.fields}
                      fieldOrder={extraction.fieldOrder as Array<keyof ExtractedContract>}
                      confidences={extraction.confidences}
                      status={extraction.status === 'streaming' ? 'streaming' : 'done'}
                      fileName={activeFile.file.name}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            reviewTarget.result && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <ExtractionResult
                  contract={reviewTarget.result}
                  confidences={extraction.confidences}
                  fileName={reviewTarget.file.name}
                  onSave={handleSave}
                  onDiscard={handleDiscard}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>

        <SpendingCharts refreshKey={refreshKey} />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <p className="text-[14px] font-medium text-white/85">Saved bills</p>
            <p className="text-[12px] text-white/30 mt-0.5">Your obligation library</p>
          </div>
          <div className="p-4">
            <ContractList refreshKey={refreshKey} />
          </div>
        </motion.div>

      </div>
    </div>
  )
}
