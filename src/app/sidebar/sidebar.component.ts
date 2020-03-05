import { Component, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { SideBarService } from 'app/services/sidebar.service';
import { filter } from 'rxjs/operators';
import { StorageService } from 'app/services/storage.service';
import { Subject } from 'rxjs/Subject';
import { KeycloakService } from 'app/services/keycloak.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  public isNavMenuOpen = false;
  public routerSnapshot = null;
  public isInspectorRole = false;
  public showNotificationProjects = false;
  public showProjectDetails = false;
  public showProjectDetailsSubItems = false;
  public showProjectNotificationDetails = false;
  public currentProjectId = '';
  public mainRouteId = '';
  public currentMenu = '';
  public showArchiveButton = false;

  @HostBinding('class.is-toggled')
  isOpen = false;
  isArchive = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private keycloakService: KeycloakService,
    private sideBarService: SideBarService,
  ) {

    router.events.pipe(
      filter(event => event instanceof NavigationEnd))
      .takeUntil(this.ngUnsubscribe)
      .subscribe(event => {
        this.routerSnapshot = event;
        this.SetActiveSidebarItem();
      });
  }

  ngOnInit() {
    this.sideBarService.archiveChange
    .takeUntil(this.ngUnsubscribe)
    .subscribe(isArchive => {
      this.isArchive = isArchive;
    });

    this.sideBarService.toggleChange
      .takeUntil(this.ngUnsubscribe)
      .subscribe(isOpen => {
        this.isOpen = isOpen;
      });

    const roles = this.keycloakService.getUserRoles();
    if (roles !== null && roles.includes('inspector')) {
      this.isInspectorRole = true;
    }
  }

  SetActiveSidebarItem() {
    const urlArray = this.routerSnapshot.url.split('/');

    // The first element will be empty, so shift in order to remove it.
    urlArray.shift();
    const [mainRoute, mainRouteId, currentMenu] = urlArray;

    this.mainRouteId = mainRouteId;
    this.currentMenu = currentMenu && currentMenu.split(';')[0];

    switch (mainRoute) {
      case 'p':
        this.showProjectDetails = true;
        this.showProjectNotificationDetails = false;
        break;

      case 'pn':
        this.showProjectNotificationDetails = true;
        this.showProjectDetails = false;
        break;
      default:
        // There is now submenu so the main route ID becomes the main route. This is a root level page.
        this.mainRouteId = mainRoute;
    }
  }

  toggleDropdown() {
    this.showProjectDetailsSubItems = !this.showProjectDetailsSubItems;
  }

  toggleNav() {
    this.isNavMenuOpen = !this.isNavMenuOpen;
  }

  closeNav() {
    this.isNavMenuOpen = false;
  }

  goToDocuments(currentProjectId) {
    this.storageService.state.projectDocumentTableParams = null;
    this.router.navigate(['p', currentProjectId, 'project-documents']);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
