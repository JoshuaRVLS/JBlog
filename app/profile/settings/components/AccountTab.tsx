"use client";

import {
  Mail,
  Globe,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";

interface AccountTabProps {
  user: any;
  newEmail: string;
  setNewEmail: (email: string) => void;
  emailPassword: string;
  setEmailPassword: (password: string) => void;
  showEmailPassword: boolean;
  setShowEmailPassword: (show: boolean) => void;
  changingEmail: boolean;
  emailVerificationCode: string;
  setEmailVerificationCode: (code: string) => void;
  emailChangeStep: "request" | "verify";
  setEmailChangeStep: (step: "request" | "verify") => void;
  pendingNewEmail: string;
  setPendingNewEmail: (email: string) => void;
  onEmailChange: (e: React.FormEvent) => void;
  country: string;
  setCountry: (country: string) => void;
  changingCountry: boolean;
  onCountryChange: (e: React.FormEvent) => void;
  countries: string[];
  deletePassword: string;
  setDeletePassword: (password: string) => void;
  showDeletePassword: boolean;
  setShowDeletePassword: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  deletingAccount: boolean;
  onDeleteAccount: () => void;
}

export default function AccountTab({
  user,
  newEmail,
  setNewEmail,
  emailPassword,
  setEmailPassword,
  showEmailPassword,
  setShowEmailPassword,
  changingEmail,
  emailVerificationCode,
  setEmailVerificationCode,
  emailChangeStep,
  setEmailChangeStep,
  pendingNewEmail,
  setPendingNewEmail,
  onEmailChange,
  country,
  setCountry,
  changingCountry,
  onCountryChange,
  countries,
  deletePassword,
  setDeletePassword,
  showDeletePassword,
  setShowDeletePassword,
  showDeleteModal,
  setShowDeleteModal,
  deletingAccount,
  onDeleteAccount,
}: AccountTabProps) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Pengaturan Akun</h1>

      {/* Change Email */}
      <div className="border-b border-border/50 pb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Ubah Email
        </h2>
        {emailChangeStep === "request" ? (
          <form onSubmit={onEmailChange} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Saat Ini</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Baru</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type={showEmailPassword ? "text" : "password"}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Masukkan password untuk konfirmasi"
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showEmailPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={changingEmail}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {changingEmail ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Mengirim kode...</span>
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  <span>Kirim Kode Verifikasi</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={onEmailChange} className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-foreground">
                <strong>Kode verifikasi telah dikirim ke:</strong> {pendingNewEmail}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Silakan cek email Anda dan masukkan kode verifikasi di bawah ini.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Kode Verifikasi</label>
              <input
                type="text"
                value={emailVerificationCode}
                onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl font-mono tracking-widest"
                required
              />
              <p className="text-xs text-muted-foreground">
                Masukkan 6 digit kode verifikasi yang dikirim ke email baru Anda
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmailChangeStep("request");
                  setEmailVerificationCode("");
                  setPendingNewEmail("");
                }}
                className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={changingEmail || emailVerificationCode.length !== 6}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {changingEmail ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Mengubah email...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    <span>Verifikasi & Ubah Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Country */}
      <div className="border-b border-border/50 pb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Ubah Negara
        </h2>
        <form onSubmit={onCountryChange} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Negara</label>
            <CustomSelect
              options={countries.map((c) => ({ value: c, label: c }))}
              value={country}
              onChange={(value) => setCountry(value)}
              placeholder="Pilih Negara"
              searchable={true}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Pilih negara untuk ditampilkan di globe visualization
            </p>
          </div>
          <button
            type="submit"
            disabled={changingCountry}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {changingCountry ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Simpan Negara</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Delete Account */}
      <div className="border-b border-border/50 pb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Hapus Akun
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Menghapus akun akan menghapus semua data Anda secara permanen. Tindakan ini tidak dapat
          dibatalkan.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Trash2 className="h-5 w-5" />
          <span>Hapus Akun</span>
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Hapus Akun</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Tindakan ini akan menghapus akun Anda secara permanen. Semua data termasuk posts, comments, dan
                informasi lainnya akan dihapus dan tidak dapat dikembalikan.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Konfirmasi Password</label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Masukkan password untuk konfirmasi"
                      className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showDeletePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                    }}
                    className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={onDeleteAccount}
                    disabled={deletingAccount || !deletePassword}
                    className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-5 w-5" />
                        <span>Hapus Akun</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

