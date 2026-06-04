import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SearchComponent } from './search/search.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { CreateSessionComponent } from './create-session/create-session.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'recherche', component: SearchComponent },
  { path: 'inscription', component: RegisterComponent },
  { path: 'profil', component: ProfileComponent },
  { path: 'creer-session', component: CreateSessionComponent },
  { path: 'connexion', component: LoginComponent }
];
