<?php
namespace App\Http\Controllers;
class TestController extends Controller{
        public function index(){
            return "je suis le contrôleur TestController";
        }
        public function show(){
            return view("accueil");
        }
}
?>