import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget { const LoginScreen({super.key}); @override ConsumerState<LoginScreen> createState()=>_L();}
class _L extends ConsumerState<LoginScreen>{
  final _e=TextEditingController(), _p=TextEditingController(); bool _loading=false; String? _err;
  @override Widget build(BuildContext context){
    return Scaffold(backgroundColor: Colors.black, appBar: AppBar(backgroundColor: Colors.black, title: const Text('Login')),
      body: Padding(padding: const EdgeInsets.all(24), child: Column(children:[
        TextField(controller:_e, style: const TextStyle(color:Colors.white), decoration: const InputDecoration(labelText:'Email', labelStyle:TextStyle(color:Colors.grey), enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color:Colors.grey)))),
        TextField(controller:_p, obscureText:true, style: const TextStyle(color:Colors.white), decoration: const InputDecoration(labelText:'Password', labelStyle:TextStyle(color:Colors.grey))),
        if(_err!=null) Padding(padding: const EdgeInsets.only(top:12), child: Text(_err!, style:const TextStyle(color:Colors.redAccent))),
        const SizedBox(height:24),
        SizedBox(width:double.infinity, child: ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1DB954), foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical:14)), onPressed: _loading?null : () async { setState(()=>_loading=true); try{ await ref.read(authProvider.notifier).signIn(_e.text.trim(), _p.text); if(mounted) context.go('/');}catch(e){ setState(() {_err=e.toString(); _loading=false;}); return;} setState(()=>_loading=false);}, child: _loading?const SizedBox(width:18,height:18, child:CircularProgressIndicator(strokeWidth:2, color:Colors.black)): const Text('Login', style:TextStyle(fontWeight:FontWeight.w800)))),
        TextButton(onPressed:()=>context.push('/register'), child: const Text('Belum punya akun? Register', style:TextStyle(color:Colors.grey))),
      ])));
  }
}
