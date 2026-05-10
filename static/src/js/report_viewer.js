/** @odoo-module **/

import { registry } from "@web/core/registry";

// Register the client action
registry.category("actions").add("zimbabwe_payroll.report_viewer", function (action, options) {
    // Open the report viewer modal
    if (window.ZimbabweReportViewer) {
        window.ZimbabweReportViewer.init();
    }
    return { type: 'ir.actions.act_window_close' };
});

// Standalone report viewer object
(function() {
    'use strict';

    window.ZimbabweReportViewer = {
        
        init: function() {
            this.openModal();
        },

        openModal: function() {
            const existing = document.getElementById('zw-report-modal');
            if (existing) {
                existing.remove();
            }

            this.fetchPayRuns().then(payRuns => {
                this.renderModal(payRuns);
            });
        },

        fetchPayRuns: function() {
        return new Promise((resolve) => {
            fetch('/web/dataset/call_kw/hr.payslip.run/search_read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        model: 'hr.payslip.run',
                        method: 'search_read',
                        args: [[]],
                        kwargs: {
                            fields: ['id', 'name', 'date_start', 'date_end'],
                            order: 'date_start DESC',
                            limit: 50
                        }
                    },
                    id: Math.floor(Math.random() * 1000000)
                })
            })
            .then(r => r.json())
            .then(d => resolve(d.result || []))
            .catch(() => resolve([]));
        });
    },

        renderModal: function(payRuns) {
            const options = payRuns.map(pr => 
                `<option value="${pr.id}">${pr.name} (${pr.date_start} to ${pr.date_end})</option>`
            ).join('');

            const html = `
                <div id="zw-report-modal" class="zw-modal-backdrop">
                    <div class="zw-modal-container">
                        <div class="zw-modal-header">
                            <h2>Generate Payroll Report</h2>
                            <button class="zw-modal-close" onclick="document.getElementById('zw-report-modal').remove()">×</button>
                        </div>
                        <div class="zw-modal-body">
                            <div class="zw-form-group">
                                <label>Pay Run:</label>
                                <select id="zw-payrun-select" class="zw-form-control">
                                    <option value="">Select a Pay Run...</option>
                                    ${options}
                                </select>
                            </div>
                            <div class="zw-form-group">
                                <label>Report Type:</label>
                                <select id="zw-report-type-select" class="zw-form-control">
                                    <option value="salary_breakdown">Salary Breakdown</option>
                                    <option value="salary_summary">Salary Summary</option>
                                    <option value="detailed_breakdown">Detailed Salary Breakdown</option>
                                    <option value="summary_breakdown">Summary Salary Breakdown</option>
                                    <option value="nssa">NSSA Report</option>
                                    <option value="nssa_p4">NSSA P4 Report</option>
                                    <option value="zimra_itf">ZIMRA ITF Report</option>
                                    <option value="nec">NEC Report</option>
                                    <option value="zimdef">ZIMDEF Report</option>
                                </select>
                            </div>
                            <div class="zw-form-group">
                                <label>Format:</label>
                                <div class="zw-format-options">
                                    <label class="zw-radio-card">
                                        <input type="radio" name="zw-format" value="pdf" checked="checked"/>
                                        <span class="zw-radio-label">PDF</span>
                                    </label>
                                    <label class="zw-radio-card">
                                        <input type="radio" name="zw-format" value="excel"/>
                                        <span class="zw-radio-label">Excel</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="zw-modal-footer">
                            <button class="zw-btn zw-btn-secondary" onclick="document.getElementById('zw-report-modal').remove()">Cancel</button>
                            <button class="zw-btn zw-btn-primary" onclick="window.ZimbabweReportViewer.generateReport()">Generate Report</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
        },

       generateReport: function() {
            const payRunId = document.getElementById('zw-payrun-select').value;
            const reportType = document.getElementById('zw-report-type-select').value;
            const format = document.querySelector('input[name="zw-format"]:checked').value;

            if (!payRunId) {
                alert('Please select a Pay Run');
                return;
            }

            const url = `/zimbabwe_payroll/export/${reportType}/${payRunId}?format=${format}`;

            if (format === 'excel') {
                // Show loading briefly then download
                this.showLoadingOverlay();
                setTimeout(() => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `payroll_report_${reportType}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    this.hideLoadingOverlay();
                    document.getElementById('zw-report-modal').remove();
                }, 800);
            } else {
                // PDF: Show loading, fetch as blob, open in custom viewer
                this.showLoadingOverlay();
                this.startProgressAnimation();
                
                fetch(url)
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to generate PDF');
                        return response.blob();
                    })
                    .then(blob => {
                        this.hideLoadingOverlay();
                        const pdfUrl = URL.createObjectURL(blob);
                        this.openPdfViewer(pdfUrl, reportType);
                        document.getElementById('zw-report-modal').remove();
                    })
                    .catch(() => {
                        this.hideLoadingOverlay();
                        // Fallback: open in browser
                        window.open(url, '_blank');
                        document.getElementById('zw-report-modal').remove();
                    });
            }
        },

        showLoadingOverlay: function() {
            const existing = document.getElementById('zw-loading-overlay');
            if (existing) existing.remove();
            
            const overlay = document.createElement('div');
            overlay.id = 'zw-loading-overlay';
            overlay.className = 'zw-loading-overlay';
            overlay.innerHTML = `
                <div class="zw-loader-content">
                    <div class="zw-spinner"></div>
                    <h3 class="zw-loader-text">Generating Report...</h3>
                    <div class="zw-progress-bar">
                        <div id="zw-progress-fill" class="zw-progress-fill" style="width: 0%"></div>
                    </div>
                    <p id="zw-status-text" class="zw-status-text">Preparing data...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        },

        hideLoadingOverlay: function() {
            const overlay = document.getElementById('zw-loading-overlay');
            if (overlay) {
                if (this._progressInterval) clearInterval(this._progressInterval);
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        },

        startProgressAnimation: function() {
            let progress = 0;
            const messages = [
                'Preparing data...',
                'Processing payslips...',
                'Formatting tables...',
                'Generating PDF...',
                'Almost done...'
            ];
            
            this._progressInterval = setInterval(() => {
                if (progress < 90) {
                    progress += Math.random() * 10;
                    if (progress > 90) progress = 90;
                    const fill = document.getElementById('zw-progress-fill');
                    const status = document.getElementById('zw-status-text');
                    if (fill) fill.style.width = progress + '%';
                    if (status) status.textContent = messages[Math.floor(Math.random() * messages.length)];
                }
            }, 300);
        },

        openPdfViewer: function(pdfUrl, reportType) {
            const viewer = window.open('', '_blank');
            if (!viewer) {
                window.open(pdfUrl, '_blank');
                return;
            }
            
            viewer.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Payroll Report - ${reportType}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; }
                        .toolbar {
                            background: white; padding: 12px 24px; display: flex;
                            justify-content: space-between; align-items: center;
                            border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        }
                        .toolbar-left { display: flex; align-items: center; gap: 16px; }
                        .toolbar-title { font-weight: 600; font-size: 16px; color: #1f2937; }
                        .toolbar-buttons { display: flex; gap: 8px; }
                        .btn {
                            padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;
                            font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 6px;
                        }
                        .btn-primary { background: #4f46e5; color: white; }
                        .btn-primary:hover { background: #4338ca; }
                        .btn-secondary { background: white; color: #374151; border: 1px solid #d1d5db; }
                        .btn-secondary:hover { background: #f9fafb; }
                        .pdf-container { height: calc(100vh - 57px); background: #525659; }
                        iframe { width: 100%; height: 100%; border: none; }
                    </style>
                </head>
                <body>
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <span class="toolbar-title">Payroll Report - ${reportType.replace(/_/g, ' ')}</span>
                        </div>
                        <div class="toolbar-buttons">
                            <button class="btn btn-secondary" onclick="window.print()">🖨 Print</button>
                            <button class="btn btn-primary" onclick="downloadPdf()">⬇ Download</button>
                        </div>
                    </div>
                    <div class="pdf-container">
                        <iframe src="${pdfUrl}" type="application/pdf"></iframe>
                    </div>
                    <script>
                        function downloadPdf() {
                            const a = document.createElement('a');
                            a.href = '${pdfUrl}';
                            a.download = 'payroll_report_${reportType}.pdf';
                            a.click();
                        }
                    </script>
                </body>
                </html>
            `);
            viewer.document.close();
        }
    };
})();