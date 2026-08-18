                {/* Standard Activity Logs */}
                {leadActivities.filter(a => a.type !== 'facebook_form').map((act) => (
                  <div key={act.id} className="relative pl-10 group">
                    <div className="absolute left-1.5 top-0 bg-[#fafafa] py-1">
                      <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shadow-sm">
                        {act.type === 'call' && <Phone className="w-2.5 h-2.5 text-emerald-600" />}
                        {act.type === 'whatsapp' && <MessageSquare className="w-2.5 h-2.5 text-teal-600" />}
                        {act.type === 'note' && <Edit3 className="w-2.5 h-2.5 text-amber-500" />}
                        {act.type === 'stage_change' && <Zap className="w-2.5 h-2.5 text-indigo-500" />}
                        {act.type !== 'call' && act.type !== 'whatsapp' && act.type !== 'note' && act.type !== 'stage_change' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                        <span className="font-bold text-slate-700">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        <span>{act.type}</span>
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                       <h4 className="text-sm font-semibold text-slate-800 mb-1">{act.title}</h4>
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Modal (Unchanged structurally, just ensuring it still renders) */}
        {isEditingLead && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Edit Lead Info</h2>
                </div>
                <button onClick={() => setIsEditingLead(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLeadEdit} className="p-6 overflow-y-auto space-y-5 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-semibold block">Full Name *</label>
                    <input type="text" required value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-semibold block">Phone *</label>
                    <input type="text" required value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-semibold block">Email</label>
                    <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-600 font-semibold block">Stage</label>
                    <select value={editForm.status || 'New Lead'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm">
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Follow Up">Follow Up</option>
                      <option value="Demo Scheduled">Demo Scheduled</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsEditingLead(false)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition-colors cursor-pointer shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer shadow-sm">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
