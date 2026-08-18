            {/* Unified Activity Timeline */}
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-3 top-2 bottom-0 w-px bg-slate-200"></div>

              {/* Feed Container */}
              <div className="space-y-8">
                
                {/* 1. Facebook Details Anchor Event */}
                <div className="relative pl-10 group">
                   <div className="absolute left-1.5 top-0 bg-[#fafafa] py-1">
                     <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                       <Facebook className="w-2.5 h-2.5 text-white" />
                     </div>
                   </div>

                   {/* Event Header */}
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                        <span className="font-bold text-slate-700">2h ago</span>
                        <span>(10:46 AM Sat, 15 Aug 26)</span>
                     </div>
                     <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <span>Facebook</span>
                        <Bot className="w-3.5 h-3.5" />
                     </div>
                   </div>

                   {/* White Card Content */}
                   <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      
                      {/* Facebook Details Block */}
                      <div className="px-5 py-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Facebook className="w-4 h-4 text-blue-600" />
                          <h3 className="text-base text-slate-600 font-medium">Facebook Details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[13px] border border-slate-200 rounded-xl p-4 bg-white">
                           <div className="flex space-x-2"><span className="text-slate-400 w-20">Form:</span> <span className="text-slate-700 font-medium">Master Form</span></div>
                           <div className="flex space-x-2"><span className="text-slate-400 w-20">Campaign:</span> <span className="text-slate-700 font-medium">{lead.campaignName || 'Leads - CBO - Master Form - Karnataka'}</span></div>
                           <div className="flex space-x-2"><span className="text-slate-400 w-20">Page:</span> <a href="#" className="text-indigo-600 hover:underline font-medium">Kite Institute of Aviation & Hospitality</a></div>
                           <div className="flex space-x-2"><span className="text-slate-400 w-20">Ad:</span> <a href="#" className="text-indigo-600 hover:underline font-medium">{lead.adName || 'Vidya'}</a></div>
                        </div>
                      </div>

                      {/* Lead Details Block */}
                      <div className="px-5 pb-5">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="rotate-90">
                             <MoreVertical className="w-4 h-4 text-purple-400" />
                          </div>
                          <h3 className="text-base text-slate-600 font-medium">Lead Details</h3>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-left text-[13px]">
                            <thead className="bg-white border-b border-slate-200">
                              <tr>
                                <th className="px-5 py-3 font-semibold text-slate-700 w-1/3">FB Question</th>
                                <th className="px-5 py-3 font-semibold text-slate-700 w-1/3">Telecrm Field</th>
                                <th className="px-5 py-3 font-semibold text-slate-700 w-1/3">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">full_name</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">Name</td>
                                <td className="px-5 py-3 text-slate-700">{lead.name}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">email</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">Email</td>
                                <td className="px-5 py-3 text-slate-700">{lead.email}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">phone_number</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">Phone</td>
                                <td className="px-5 py-3 text-slate-700">{lead.phone}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">date_of_birth</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">DOB</td>
                                <td className="px-5 py-3 text-slate-700">{lead.dateOfBirth || '2004-08-29'}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">city</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">City</td>
                                <td className="px-5 py-3 text-slate-700">{lead.city || 'Kampli'}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">state</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">State</td>
                                <td className="px-5 py-3 text-slate-700">{lead.state || 'Karnataka'}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">gender</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">Gender</td>
                                <td className="px-5 py-3 text-slate-700">{lead.gender || 'male'}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">telecrm_ad_name</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">Facebook ad</td>
                                <td className="px-5 py-3 text-slate-700">{lead.adName || 'Vidya'}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">telecrm_campaign_name</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">Facebook Campaign</td>
                                <td className="px-5 py-3 text-slate-700">{lead.campaignName || 'Leads - CBO - Master Form - Karnataka'}</td>
                              </tr>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">telecrm_lead_id</td>
                                <td className="px-5 py-3 text-purple-700 font-medium">Facebook Lead id</td>
                                <td className="px-5 py-3 text-slate-700">2308429789900885</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                   </div>
                </div>
