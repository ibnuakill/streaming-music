import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/config/app_config.dart';

final supabaseProvider = Provider<SupabaseClient>((_)=>Supabase.instance.client);

class AuthState { final Session? session; final User? user; final Map? profile; final bool loading; const AuthState({this.session, this.user, this.profile, this.loading=true}); }
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier():super(const AuthState()){ _init(); }
  Future<void> _init() async {
    final s=Supabase.instance.client.auth.currentSession;
    state=AuthState(session:s, user:s?.user, loading:false);
    if(s?.user!=null) _fetch();
    Supabase.instance.client.auth.onAuthStateChange.listen((e){ final sess=e.session; state=AuthState(session:sess, user:sess?.user, profile: state.profile, loading:false); if(sess?.user!=null) _fetch();});
  }
  Future<void> _fetch() async { final u=state.user; if(u==null) return; try{ final r=await Supabase.instance.client.from('musera_profiles').select().eq('id', u.id).single(); state=AuthState(session:state.session, user:state.user, profile:r, loading:false);}catch(_){}}
  Future<void> signUp(String e,String p,String n) async => await Supabase.instance.client.auth.signUp(email:e, password:p, data:{'display_name':n});
  Future<void> signIn(String e,String p) async => await Supabase.instance.client.auth.signInWithPassword(email:e, password:p);
  Future<void> signOut() async { await Supabase.instance.client.auth.signOut(); state=const AuthState(session:null, user:null, profile:null, loading:false); }
}
final authProvider=StateNotifierProvider<AuthNotifier, AuthState>((_)=>AuthNotifier());
