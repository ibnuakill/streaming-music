import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_provider.dart';
class RegisterScreen extends ConsumerStatefulWidget { const RegisterScreen({super.key}); @override ConsumerState<RegisterScreen> createState()=>_R();}
class _R extends ConsumerState<RegisterScreen>{
  final _e=TextEditingController(), _p=TextEditingController(), _n=TextEditingController(); bool _loading=false; String? _err;
  @override Widget build(BuildContext context){
    return Scaffold(backgroundColor: Colors.black, appBar: AppBar(backgroundColor: Colors.black, title: const Text('Register')),
      body: Padding(padding: const EdgeInsets.all(24), child: Column(children:[
        TextField(controller:_n, style: const TextStyle(color:Colors.white), decoration: const InputDecoration(labelText:'Display name', labelStyle:TextStyle(color:Colors.grey))),
        TextField(controller:_e, style: const TextStyle(color:Colors.white), decoration: const InputDecoration(labelText:'Email', labelStyle:TextStyle(color:Colors.grey))),
        TextField(controller:_p, obscureText:true, style: const TextStyle(color:Colors.white), decoration: const InputDecoration(labelText:'Password', labelStyle:TextStyle(color:Colors.grey))),
        if(_err!=null) Padding(padding: const EdgeInsets.only(top:12), child: Text(_err!, style:const TextStyle(color:Colors.redAccent))),
        const SizedBox(height:24),
        SizedBox(width:double.infinity, child: ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1DB954), foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical:14)), onPressed: _loading?null : () async { setState(()=>_loading=true); try{ await ref.read(authProvider.notifier).signUp(_e.text.trim(), _p.text, _n.text.trim()); if(mounted) context.go('/');}catch(e){ setState(() {_err=e.toString(); _loading=false;}); return;} setState(()=>_loading=false);}, child: _loading?const SizedBox(width:18,height:18, child:CircularProgressIndicator(strokeWidth:2, color:Colors.black)): const Text('Register', style:TextStyle(fontWeight:FontWeight.w800)))),
      ])));
  }
}
