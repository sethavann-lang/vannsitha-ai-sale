import Link from "next/link";
export default function PiseyAppInformation() {
  return <>
    <h1 className="text-3xl font-bold leading-snug">OpenClaw Sok Pisey</h1>
    <p className="text-lg text-slate-600">ជំនួយការសម្រាប់ការងារផ្ទៃក្នុងរបស់ Vann Sitha Trading</p>
    <p>OpenClaw Sok Pisey is a private operational assistant used by Vann Sitha Trading. It helps authorized users read business information, prepare responses, monitor spreadsheet workflows and support approved Google Sheets updates.</p>
    <h2 className="text-xl font-bold">Google Workspace integration</h2>
    <ul className="list-disc space-y-2 pl-6"><li>Account identity and email select the Google account authorized by its owner.</li><li>Read-only Google Drive access supports reading authorized files when a requested feature needs them.</li><li>Google Sheets access supports reading operational data, maintaining a request journal and making approved updates through the configured workflows.</li></ul>
    <p>Business information may include sales records, orders and contact information contained in the authorized files. Existing workflow approval requirements apply to order changes.</p>
    <p>This information page does not provide access to the assistant, the owner’s Google account or business data. Use of the operational services is restricted to authorized users.</p>
    <h2 className="text-xl font-bold">Privacy and use</h2>
    <p>សូមអានគោលការណ៍ឯកជនភាព និងលក្ខខណ្ឌប្រើប្រាស់ខាងក្រោម។</p>
    <p><Link className="font-medium text-orange-800 underline" href="/openclaw-sok-pisey/privacy">Privacy Policy</Link> · <Link className="font-medium text-orange-800 underline" href="/openclaw-sok-pisey/terms">Terms of Use</Link></p>
  </>;
}
