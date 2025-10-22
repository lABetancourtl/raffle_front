import { Routes } from '@angular/router';
import { HomeComponent } from './public/home/home.component';
import { LoginComponent } from './admin/login/login.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { NewRaffleComponent } from './admin/dashboard/pages/new-raffle/new-raffle.component';
import { RafflesComponent } from './admin/dashboard/pages/raffles/raffles.component';
import { DocumentValidationComponent } from './admin/dashboard/pages/document-validation/document-validation.component';
import { AuthGuard } from './guards/auth.guard';
import { ValidationEmailComponent } from './public/validation-email/validation-email.component';



export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' }, 
    { path: 'home', component: HomeComponent },
    { path: 'validationEmail', component: ValidationEmailComponent },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], children: [
        { path: '', redirectTo: 'newraffle', pathMatch: 'full' },
        { path: 'newraffle', component: NewRaffleComponent }, 
        { path: 'raffles', component: RafflesComponent }, 
        { path: 'documentvalidation', component: DocumentValidationComponent }, 
    ] },
    { path: '**', redirectTo: 'home' }
];
