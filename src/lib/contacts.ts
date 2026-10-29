import { getSupabaseBrowserClient } from './supabase';
export type Contact = { id: string; nom: string; prenom: string; email: string; created_at: string };
export type ContactInput = Pick<Contact, 'nom' | 'prenom' | 'email'>;
const COLUMNS = 'id,nom,prenom,email,created_at';

async function authenticatedClient() {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
  return client;
}
function failure(code?: string): Error {
  if (code === '42501') return new Error('Accès refusé. Vérifiez les règles d’accès Supabase et votre connexion.');
  if (code === 'PGRST116') return new Error('Ce contact n’est plus accessible. Actualisez la liste.');
  return new Error('L’opération Supabase a échoué. Vérifiez votre connexion puis actualisez la liste avant de réessayer.');
}
export async function readContacts(): Promise<Contact[]> {
  const client = await authenticatedClient();
  const { data, error } = await client.from('contacts').select(COLUMNS).order('created_at', { ascending: false }).order('id', { ascending: false });
  if (error) throw failure(error.code);
  return data as Contact[];
}
export async function saveContact(input: ContactInput, id?: string): Promise<Contact> {
  const value = { nom: input.nom.trim(), prenom: input.prenom.trim(), email: input.email.trim().toLowerCase() };
  if (!value.nom || !value.prenom) throw new Error('Le nom et le prénom sont obligatoires.');
  if (value.nom.length > 100 || value.prenom.length > 100) throw new Error('Le nom et le prénom sont limités à 100 caractères.');
  if (value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw new Error('Saisissez une adresse e-mail valide.');
  const client = await authenticatedClient();
  const query = id ? client.from('contacts').update(value).eq('id', id) : client.from('contacts').insert(value);
  const { data, error } = await query.select(COLUMNS).single();
  if (error) throw failure(error.code);
  return data as Contact;
}
export async function deleteContact(id: string): Promise<void> {
  const client = await authenticatedClient();
  const { error } = await client.from('contacts').delete().eq('id', id).select('id').single();
  if (error) throw failure(error.code);
}
