import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { TransactionService } from '../../core/services/transaction.service';
import { WalletResponse } from '../../core/models/wallet.model';
import {
  TransactionResponse,
  TransactionSummaryResponse,
} from '../../core/models/transaction.model';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar";
import { TopbarComponent } from "../../shared/components/topbar/topbar";

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class TransactionsComponent implements OnInit {
  private auth = inject(AuthService);
  private txSvc = inject(TransactionService);
  private walletSvc = inject(WalletService);

  username = '';
  email = '';
  currentUserId = 0;

  selectedTx: TransactionResponse | null = null;
  wallet: WalletResponse | null = null;

  get initials(): string {
    return this.username.slice(0, 2).toUpperCase() || 'U';
  }

  transactions: TransactionResponse[] = [];
  loading = true;
  error = '';

  currentPage = 0;
  totalPages = 1;
  totalElements = 0;
  pageSize = 10;

  filterType: 'ALL' | 'TOPUP' | 'TRANSFER' | 'WITHDRAW' = 'ALL';
  filterStatus: 'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED' = 'ALL';
  searchTerm = '';

  openModal(tx: TransactionResponse): void { this.selectedTx = tx; }
  closeModal(): void { this.selectedTx = null; }

  get filtered(): TransactionResponse[] {
    return this.transactions.filter((t) => {
      const typeMatch = this.filterType === 'ALL' || t.type === this.filterType;
      const statusMatch = this.filterStatus === 'ALL' || t.status === this.filterStatus;
      const searchMatch =
        !this.searchTerm ||
        t.transactionId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.amount.toString().includes(this.searchTerm);
      return typeMatch && statusMatch && searchMatch;
    });
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  summary: TransactionSummaryResponse | null = null;
  summaryLoading = true;
  summaryError = '';

  get totalReceived(): number {
    if (!this.summary) return 0;
    return (
      (this.summary.topup?.totalAmount ?? 0) + (this.summary.transfersReceived?.totalAmount ?? 0)
    );
  }

  get totalSent(): number {
    if (!this.summary) return 0;
    return (
      (this.summary.withdraw?.totalAmount ?? 0) + (this.summary.transfersSent?.totalAmount ?? 0)
    );
  }

  get totalTransactions(): number {
    return this.summary?.overall?.totalTransactions ?? 0;
  }

  get netFlow(): number {
    return this.summary?.overall?.netFlow ?? 0;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.currentUserId = user?.userId ?? 0;
    this.load(0);
    this.loadSummary();
    this.loadWallet();
  }

  // ─── Data loaders ───────────────────────────────────────────────────────────
  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.txSvc.getMyTransactions(page, this.pageSize).subscribe({
      next: (res) => {
        this.transactions = res.content;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load transactions.';
      },
    });
  }

  loadSummary(): void {
    this.summaryLoading = true;
    this.summaryError = '';
    this.txSvc.getTransactionSummary().subscribe({
      next: (s) => {
        this.summary = s;
        this.summaryLoading = false;
      },
      error: () => {
        this.summaryLoading = false;
        this.summaryError = 'Could not load summary.';
      },
    });
  }

  prevPage(): void {
    if (this.currentPage > 0) this.load(this.currentPage - 1);
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) this.load(this.currentPage + 1);
  }

  setType(t: typeof this.filterType): void {
    this.filterType = t;
    this.load(0); // reset to page 0 on filter change
  }

  setStatus(s: typeof this.filterStatus): void {
    this.filterStatus = s;
    this.load(0);
  }

  logout(): void {
    this.auth.logout();
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtShort(n: number): string {
    if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(1) + 'Cr';
    if (n >= 100_000) return '₹' + (n / 100_000).toFixed(1) + 'L';
    if (n >= 1_000) return '₹' + (n / 1_000).toFixed(1) + 'K';
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    const today = new Date();
    if (dt.toDateString() === today.toDateString()) {
      return 'Today, ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dt.toDateString() === yesterday.toDateString()) {
      return 'Yesterday, ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  txLabel(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'Wallet Top Up';
    if (tx.type === 'WITHDRAW') return 'Withdrawal';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId)
      return `Transfer from ${tx.username ? '@' + tx.username : 'Wallet #' + tx.walletId}`;
    return `Transfer to ${tx.targetUsername ? '@' + tx.targetUsername : tx.targetWalletId ? 'Wallet #' + tx.targetWalletId : '—'}`;
  }

  txIconBg(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'rgba(16,185,129,.1)';
    if (tx.type === 'WITHDRAW') return 'rgba(239,68,68,.08)';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId)
      return 'rgba(16,185,129,.1)';
    return 'rgba(108,99,255,.1)';
  }

  txIconColor(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return '#10B981';
    if (tx.type === 'WITHDRAW') return '#EF4444';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return '#10B981';
    return '#6C63FF';
  }

  txSign(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return '+';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return '+';
    return '-';
  }

  txAmtClass(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'amt-in';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return 'amt-in';
    return 'amt-out';
  }

  statusClass(s: string): string {
    if (s === 'COMPLETED') return 'st-done';
    if (s === 'FAILED') return 'st-fail';
    return 'st-pend';
  }

  statusLabel(s: string): string {
    if (s === 'COMPLETED') return 'Done';
    if (s === 'FAILED') return 'Failed';
    return 'Pending';
  }

  loadWallet(): void {
    this.walletSvc.getMyWallet().subscribe({
      next: (w) => (this.wallet = w),
      error: () => (this.wallet = null),
    });
  }

  private fmtDatePdf(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  exportPdf(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 0;

    // ── HEADER BAND ────────────────────────────────────────────────────────────
    doc.setFillColor(15, 12, 41);
    doc.rect(0, 0, pageW, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PayVault', margin, 14);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 148, 192);
    doc.text('Account Statement', margin, 23);

    const now = new Date();
    const genDate =
      now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      '  ' +
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    doc.setFontSize(8.5);
    doc.setTextColor(200, 195, 230);
    doc.text('Generated: ' + genDate, pageW - margin, 14, { align: 'right' });

    const filterParts = [
      this.filterType !== 'ALL' ? 'Type: ' + this.filterType : '',
      this.filterStatus !== 'ALL' ? 'Status: ' + this.filterStatus : '',
    ].filter(Boolean);
    doc.text(
      filterParts.length ? filterParts.join('  |  ') : 'All Transactions',
      pageW - margin, 23, { align: 'right' }
    );

    y = 46;

    // ── ACCOUNT HOLDER ─────────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(156, 148, 192);
    doc.text('ACCOUNT HOLDER', margin, y);

    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 19, 64);
    doc.text(this.username, margin, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 84, 128);
    doc.text(this.email || '—', margin, y + 6);
    doc.text('User ID: ' + this.currentUserId, margin, y + 12);

    // ── WALLET DETAILS (right column) ──────────────────────────────────────────
    if (this.wallet) {
      const wx = pageW / 2 + 10;
      const wy = y - 6;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(156, 148, 192);
      doc.text('WALLET', wx, wy);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 19, 64);
      doc.text('Wallet #' + this.wallet.id, wx, wy + 6);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 84, 128);
      doc.text('Currency: ' + this.wallet.currency, wx, wy + 12);
      doc.text(
        'Balance: INR ' +
        this.wallet.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        wx, wy + 18
      );
      doc.text('Status: ' + this.wallet.status, wx, wy + 24);
    }

    y += 22;

    // ── DIVIDER ────────────────────────────────────────────────────────────────
    doc.setDrawColor(220, 215, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── TABLE TITLE ────────────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(156, 148, 192);
    doc.text(
      'TRANSACTIONS  —  Page ' + (this.currentPage + 1) + '  |  ' + this.filtered.length + ' records',
      margin, y
    );
    y += 5;

    // ── TABLE ──────────────────────────────────────────────────────────────────
    const rows = this.filtered.map((tx) => [
      this.fmtDatePdf(tx.createdAt),
      tx.type,
      this.txLabel(tx),
      (this.txSign(tx) === '+' ? '+' : '-') +
      'INR ' +
      tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      this.statusLabel(tx.status),
      tx.transactionId,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Description', 'Amount', 'Status', 'Ref ID']],
      body: rows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        textColor: [26, 19, 64],
        lineColor: [220, 215, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [247, 245, 255],
        textColor: [90, 84, 128],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [252, 251, 255],
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 22 },
        2: { cellWidth: 46 },              
        3: { cellWidth: 28, halign: 'right' },  
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 32, textColor: [156, 148, 192] },  
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        if (data.column.index === 3) {
          const v = String(data.cell.raw ?? '');
          data.cell.styles.textColor = v.startsWith('+') ? [16, 185, 129] : [239, 68, 68];
        }
        if (data.column.index === 4) {
          const v = String(data.cell.raw ?? '');
          if (v === 'Done') data.cell.styles.textColor = [16, 185, 129];
          else if (v === 'Failed') data.cell.styles.textColor = [239, 68, 68];
          else data.cell.styles.textColor = [245, 158, 11];
        }
      },
    });

    // ── FOOTER (all pages) ─────────────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 148, 192);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Page ' + i + ' of ' + totalPages + '  —  PayVault Account Statement  —  Confidential',
        pageW / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save('payvault-statement-' + now.toISOString().slice(0, 10) + '.pdf');
  }
}
