"""
Zimbabwe Payroll Report Viewer Controller
Standalone implementation without preview_list_pdf dependency
"""

from odoo import http
from odoo.http import request


class ZimbabweReportViewerController(http.Controller):
    """Controller for standalone report viewer"""

    @http.route('/zimbabwe_payroll/report_viewer', type='http', auth='user')
    def report_viewer(self, **kwargs):
        """
        Serve the standalone report viewer page
        This page includes the standalone JavaScript for managing the modal
        """
        return request.render('zimbabwe_payroll.report_viewer_page', {})

    @http.route('/zimbabwe_payroll/payrun/<int:pay_run_id>/salary_breakdown', type='http', auth='user')
    def salary_breakdown_report(self, pay_run_id, format='pdf', **kwargs):
        """
        Serve salary breakdown report
        Delegates to the payroll controller endpoint
        """
        return request.redirect(f'/zimbabwe_payroll/export/salary_breakdown/{pay_run_id}?format={format}')

    @http.route('/zimbabwe_payroll/payrun/<int:pay_run_id>/salary_summary', type='http', auth='user')
    def salary_summary_report(self, pay_run_id, format='pdf', **kwargs):
        """
        Serve salary summary report
        Delegates to the payroll controller endpoint
        """
        return request.redirect(f'/zimbabwe_payroll/export/salary_summary/{pay_run_id}?format={format}')

    @http.route('/zimbabwe_payroll/payrun/<int:pay_run_id>/nssa_report', type='http', auth='user')
    def nssa_report(self, pay_run_id, format='pdf', **kwargs):
        """
        Serve NSSA report
        Delegates to the payroll controller endpoint
        """
        return request.redirect(f'/zimbabwe_payroll/export/nssa/{pay_run_id}?format={format}')

    @http.route('/zimbabwe_payroll/payrun/<int:pay_run_id>/nec_report', type='http', auth='user')
    def nec_report(self, pay_run_id, format='pdf', **kwargs):
        """
        Serve NEC report
        Delegates to the payroll controller endpoint
        """
        return request.redirect(f'/zimbabwe_payroll/export/nec/{pay_run_id}?format={format}')

    @http.route('/zimbabwe_payroll/payrun/<int:pay_run_id>/zimdef_report', type='http', auth='user')
    def zimdef_report(self, pay_run_id, format='pdf', **kwargs):
        """
        Serve ZIMDEF report
        Delegates to the payroll controller endpoint
        """
        return request.redirect(f'/zimbabwe_payroll/export/zimdef/{pay_run_id}?format={format}')

    @http.route('/zimbabwe_payroll/payrun/<int:pay_run_id>/zimra_itf_report', type='http', auth='user')
    def zimra_itf_report(self, pay_run_id, format='pdf', **kwargs):
        """
        Serve ZIMRA ITF report
        Delegates to the payroll controller endpoint
        """
        return request.redirect(f'/zimbabwe_payroll/export/zimra_itf/{pay_run_id}?format={format}')

