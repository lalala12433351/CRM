  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Subtle Gray Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity z-40 cursor-pointer"
      />

      {/* Main Drawer Panel */}
      <div className="relative w-full lg:w-[65%] xl:w-[60%] max-w-6xl h-full bg-[#fafafa] flex flex-col z-50 overflow-hidden font-sans animate-in slide-in-from-right duration-300 shadow-2xl border-l border-slate-200">
        
        {/* Top Floating Navigation */}
        <div className="absolute top-4 right-6 z-10 flex items-center bg-white border border-slate-200 rounded-full px-1 py-1 shadow-sm text-xs font-semibold text-slate-600">
           <button onClick={handlePrevLead} className="px-3 py-1 hover:text-slate-900 transition-colors flex items-center space-x-1 cursor-pointer rounded-full hover:bg-slate-50">
             <ChevronLeft className="w-3.5 h-3.5"/> <span>Prev</span>
           </button>
           <span className="px-3 text-slate-800 border-x border-slate-200">{currentIndex + 1} <span className="text-slate-400 font-normal">of</span> {totalLeadsCount}</span>
           <button onClick={handleNextLead} className="px-3 py-1 hover:text-slate-900 transition-colors flex items-center space-x-1 cursor-pointer rounded-full hover:bg-slate-50">
             <span>Next</span> <ChevronRight className="w-3.5 h-3.5"/>
           </button>
        </div>

        {/* Scrollable Feed Container */}
        <div className="flex-1 overflow-y-auto ios-scroll">
          
          <div className="max-w-4xl mx-auto pt-16 px-8 pb-12">
            
            {/* Minimalist Header */}
            <div className="mb-8">
               <div className="flex justify-between items-start">
                 <div>
                   <h1 className="text-[28px] font-bold text-slate-700 tracking-wide uppercase leading-none">{lead.name}</h1>
                   
                   <div className="flex items-center space-x-3 mt-4">
                     {/* Status Dropdown */}
                     <div className="relative">
                       <select
                         value={lead.status}
                         onChange={(e) => onUpdateLead({ ...lead, status: e.target.value as LeadStatus })}
                         className="appearance-none bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-1 pl-3 pr-7 rounded-md text-xs cursor-pointer focus:outline-none transition-colors border-none"
                       >
                         {(stages || []).map((stage: any) => (
                           <option key={stage.id || stage.name} value={stage.name}>
                             {stage.name}
                           </option>
                         ))}
                       </select>
                       <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600"/>
                     </div>
                     
                     {/* Star Rating */}
                     <div className="flex items-center space-x-0.5">
                       {[1, 2, 3, 4, 5].map((star) => (
                         <button key={star} onClick={() => handleSetRating(star)} className="p-0.5 cursor-pointer hover:scale-110 transition-transform focus:outline-none">
                           <Star className={`w-4 h-4 ${(lead.rating || 0) >= star ? 'text-slate-400 fill-slate-400' : 'text-slate-300 fill-slate-300/30'}`} />
                         </button>
                       ))}
                     </div>
                   </div>
                 </div>

                 {/* Right Actions & Assignee */}
                 <div className="flex flex-col items-end space-y-4">
                   <div className="flex items-center space-x-3 text-slate-700">
                      <button className="hover:bg-slate-200 p-1 rounded-md transition-colors font-bold text-[16px] leading-none cursor-pointer" title="Email Lead">@</button>
                      <button className="hover:bg-slate-200 p-1.5 rounded-md transition-colors cursor-pointer" title="Tag Lead"><Tag className="w-4 h-4"/></button>
                      
                      {/* More Options Menu Container */}
                      <div className="relative">
                        <button onClick={() => setShowMoreOptions(!showMoreOptions)} className="hover:bg-slate-200 p-1.5 rounded-md transition-colors cursor-pointer">
                          <MoreVertical className="w-4 h-4"/>
                        </button>
                        {showMoreOptions && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-lg py-1.5 z-20 text-sm font-medium">
                            <button onClick={() => { setShowMoreOptions(false); handleCallLead(); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700">Log Call</button>
                            <button onClick={() => { setShowMoreOptions(false); const n = prompt('Add Note:'); if(n) onAddActivity({leadId: lead.id, type: 'note', title: 'Note', description: n}); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700">Add Note</button>
                            <button onClick={() => { setShowMoreOptions(false); handleStartEdit(); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700">Edit Lead Data</button>
                          </div>
                        )}
                      </div>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <span className="text-sm text-slate-600 font-medium tracking-wide">{lead.ownerAgentName || 'Unassigned'}</span>
                     <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm">
                       {getAgentInitials(lead.ownerAgentName)}
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Minimal Separator */}
               <div className="flex items-center mt-5 mb-4 text-xs text-slate-400">
                 <Pin className="w-3.5 h-3.5 mr-1" />
                 <FileText className="w-3.5 h-3.5 mr-1.5" />
                 <span>Facebook form : <em className="italic">empty</em> → <strong className="font-semibold text-slate-500">1599556721242886</strong></span>
                 <span className="ml-auto flex items-center space-x-1">2h <Bot className="w-3.5 h-3.5 ml-1"/></span>
               </div>
            </div>
