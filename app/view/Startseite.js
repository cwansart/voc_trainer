Ext.define('voc_trainer.view.Startseite', {
    extend: 'Ext.NavigationView',
    xtype: 'startseite',
    
    config: {
        items: [{
            title: 'Vokabeltrainer',
            items: [
                {
                    xtype: 'button',
                    text: 'Anleitung',
                    handler: function() {
                        this.getParent().getParent().push({
                            xtype: 'panel',
                            title: 'Anleitung',
                            activeItem: 0
                        });
                    }
                },
                {
                    xtype: 'button',
                    text: 'Karteiverwaltung',
                    handler: function() {
                        this.getParent().getParent().push({
                            xtype: 'panel',
                            title: 'Karteiverwaltung',
                            activeItem: 1
                        });
                    }
                },
                {
                    xtype: 'button',
                    text: 'Einstellungen',
                    handler: function() {
                        this.getParent().getParent().push({
                            xtype: 'panel',
                            title: 'Einstellungen',
                            activeItem: 2
                        });
                    }
                }
            ]
        }]
    }
});
