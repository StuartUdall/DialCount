define('workflow/init',['ui.api.v1' /*, 'modules/crm.api',*/ /*'modules/button-manager'*/],
    function (UiApi /*, CrmApi, ButtonManager*/) {
        return {
            initialize: function () {
                //Place your library initialization code here
                UiApi.Logger.debug('CrmApi:workflow:initialize');

                // CrmApi.initialize();
                // ButtonManager.initialize();
            },

            onModelLoad: function () {
                //Place your server model subscription code here
                UiApi.Logger.debug('CrmApi:workflow:onModelLoad');
                // ButtonManager.onModelLoad();
            },

            onModelUnload: function () {
                //Place your cleanup code here
                UiApi.Logger.debug('CrmApi:workflow:onModelUnload');
                // ButtonManager.onModelUnload();
            }
        };
    });

/*
Development:
https://psapps002.atl.five9.com/adttest3/3rdparty.bundle.js
https://psapps002.atl.five9.com/adttest3/3rdparty.bundle.css

Production:
https://app.ps.five9.com/sms-service/3rdparty.bundle.js
https://app.ps.five9.com/sms-service/3rdparty.bundle.css
 */
define('presentation.models/five9SMS',['five9', 'ui.api.v1'],
  function(Five9, UiApi) {
    return UiApi.PresentationModel.extend({
      initialize: function () {
        var options = {};
        this._status = 'Ready...';
        this._statusCall = 'Ready...';
        this._smsNumbers = [];
        this._number = '';
        this._channel = '';
        this._message = '';
        this._numberCall = '';
        this._channelCall = '';
        this._messageCall = '';
        this._multimediaEnabled = false;

        options.sourceModel = new UiApi.ModelAggregator([]);
        options.computedAttributes = {
          status: this.status,
          number: this.number,
          channel: this.channel,
          message: this.message,
          file: this.file,
          statusCall: this.statusCall,
          numberCall: this.numberCall,
          channelCall: this.channelCall,
          messageCall: this.messageCall,
          fileCall: this.fileCall,
          smsNumbers: this.smsNumbers,
          sendButtonEnabled: this.sendButtonEnabled,
          multimediaEnabled: this.multimediaEnabled
        };
        this._init(options);
        this.loadNumbers();
      },

      status: function(call) {
        if (call) {
          return this._statusCall;
        }
        return this._status;
      },

      statusCall: function() {
        return this._statusCall;
      },

      number: function(call) {
        if (call) {
          return this._numberCall;
        }
        return this._number;
      },

      numberCall: function() {
        return this._numberCall;
      },

      setNumber: function(number, call) {
        if (call) {
          this._numberCall = number;
        } else {
          this._number = number;
        }
        this.sendButtonEnabled(call);
      },

      channel: function(call) {
        if (call) {
          return this._channelCall;
        }
        return this._channel;
      },

      channelCall: function(call) {
        return this._channelCall;
      },

      setChannel: function(channel, call) {
        if (call) {
          this._channelCall = channel;
        } else {
          this._channel = channel;
        }
        Five9.vent.trigger('five9SMS:channels:loaded');
      },

      message: function(call) {
        if (call) {
          return this._messageCall;
        }
        return this._message;
      },

      messageCall: function(call) {
        return this._messageCall;
      },

      setMessage: function(message, call) {
        if (call) {
          this._messageCall = message;
        } else {
          this._message = message;
        }
        this.sendButtonEnabled(call);
      },

      smsNumbers: function() {
        return this._smsNumbers;
      },

      checkLength: function(str) {
        if (str) {
          return str.length;
        }
        return 0;
      },

      sendButtonEnabled: function(call) {
        var enabled;

        enabled = ((this.checkLength(this.number(call)) > 0) &&
            (this.checkLength(this.channel(call)) > 0) &&
            (this.checkLength(this.message(call)) > 0));

        if (enabled !== this._sendButtonEnabled) {
          this._sendButtonEnabled = enabled;
          Five9.vent.trigger('five9SMS:channels:loaded');
        }
        return enabled;
      },

      multimediaEnabled: function(call) {
        var multimediaChannel = false;
        var channel = this.channel(call);

        if (channel && this._smsNumbers) {
          for (var x = 0; x < this._smsNumbers.length; x++) {
            if (channel === this._smsNumbers[x].number && this._smsNumbers[x].media) {
              multimediaChannel = true;
            }
          }
        }
        return multimediaChannel || this._multimediaEnabled;
      },

      setFile: function(file, call) {
        if (call) {
          this._fileCall = file;
        } else  {
          this._file = file;
        }
        Five9.vent.trigger('five9SMS:channels:loaded');
      },

      cancelFile: function(call) {
        if (call) {
          this._fileCall = undefined;
        } else {
          this._file = undefined;
        }
        Five9.vent.trigger('five9SMS:channels:loaded');
      },

      file: function(call) {
        if (call) {
          return this._fileCall;
        } else {
          return this._file;
        }
      },

      fileCall: function() {
        return this._fileCall;
      },

      fileCount: function(call) {
        var file = this.file(call);
        if (file) {
          return file.files.length;
        }
        return 0;
      },

      files: function(call) {
        var file = this.file(call);
        if (file) {
          return file.files;
        }
        return undefined;
      },

      onFileChange: function(files) {
        $("#fileStatusInfo").show();

        if (files && files.length > 0) {
          var file = files[0];
          var imageType = /^image\//;

          if (!imageType.test(file.type)) {
            return;
          }

          var preview = document.getElementById("fileStatusInfo");
          if (preview) {
            preview.innerHTML = "";

            var img = document.createElement("img");
            img.src = window.URL.createObjectURL(file);
            if (this.preview.height) {
              img.height = this.preview.height;
            }
            if (this.preview.width) {
              img.width = this.preview.width;
            }

            img.onload = function () {
              window.URL.revokeObjectURL(this.src);
            };

            var br = document.createElement("br");
            var info = document.createElement("div");
            var fileStatSpan = document.createElement("span");
            var fileSize = (file.size / 1024) / 1024;
            fileStatSpan.innerHTML = file.name + ": " + fileSize.toFixed(2) + " MB";
            fileStatSpan.style.fontFamily = "Roboto";
            fileStatSpan.style.fontSize = "12px";
            if (fileSize > 1) {
              fileStatSpan.style.color = "red";
            } else {
              fileStatSpan.style.color = "black";
            }

            preview.appendChild(img);
            preview.appendChild(br);
            preview.appendChild(fileStatSpan);
            preview.appendChild(info);
          }
        }
      },

      createFileUploadControl: function() {
        try {
          var self = this;
          var fileUploadCtrl = document.getElementById('fileInput');
          var fileInputButton = document.getElementById('fileInputButton');

          if (fileUploadCtrl && fileInputButton) {
            this.log('createFileUploadControl:');

            // Create a new FileUpload element.
            var newFileUploadCtrl = document.createElement("input");
            newFileUploadCtrl.type = "file";
            newFileUploadCtrl.style.display = "none";

            // Append it next to the original FileUpload.
            fileUploadCtrl.parentNode.insertBefore(newFileUploadCtrl, fileUploadCtrl.nextSibling);

            // Remove the original FileUpload.
            fileUploadCtrl.parentNode.removeChild(fileUploadCtrl);

            // Set the Id and Name to the new FileUpload.
            newFileUploadCtrl.id = 'fileInput';
            newFileUploadCtrl.name = 'fileInput';
            newFileUploadCtrl.accept = ".gif,.png,.jpg,.jpeg";
            newFileUploadCtrl.onchange = function () {
              self.onFileChange(document.getElementById("fileInput").files);
            };
          }
        } catch(exception) {
          this.error('Exception: ' + exception.message);
        }
      },

      setResult: function(success, message, call) {
        if (call) {
          this._statusCall = message;
          if (success) {
            this._messageCall = '';
            this._fileCall = undefined;
          }
        } else {
          this._status = message;
          if (success) {
            this._message = '';
            this._file = undefined;
          }
        }
        Five9.vent.trigger('five9SMS:channels:loaded');
      },

      send: function(call) {
        this.setResult(false, 'Sending...', call);
        if (this.fileCount(call) > 0 && this.multimediaEnabled(call)) {
          this.sendMedia(this.number(call), this.channel(call), this.message(call), call);
        } else {
          this.sendMessage(this.number(call), this.channel(call), this.message(call), call);
        }
      },

      sendMessage: function(number, channelId, message, call) {
        var self = this;
        var url = this.smsServer + '/send';
        var payload = {number: number, channelId: channelId, message: message, metadata: this.agentInfo.userName, apitoken: this.apitoken};

        this.log('Payload: ' + JSON.stringify(payload));

        fetch(url, {
          method: 'POST',
          cache: 'no-cache',
          credentials: 'omit',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(payload)
        }).then(function(response) {
          self.log('Response: ' + JSON.stringify(response));
          if (response.status === 200) {
            self.log('Success', response);
            self.setResult(true, 'Message Sent!', call);
            self.saveNote(number, channelId, message);
          } else {
            self.error('Failed to send message ' + response.body);
            self.setResult(false, 'Send Failed!', call);
          }
        });
      },

      sendMedia: function(number, channelId, message, call) {
        var self = this;
        var filename;
        var files = this.files(call);
        var formData = new FormData();
        var url = this.smsServer + '/send-media';

        for (var i = 0; i < files.length; i++) {
          filename = files[i].name;
          this.log('File: ' + filename);
          formData.append(files[i].name, files[i]);
        }

        formData.append('number', number);
        formData.append('channelId', channelId);
        formData.append('apitoken', this.apitoken);
        formData.append('message', message);
        formData.append('metadata', this.agentInfo.userName);

        fetch(url, {
          method: 'POST',
          cache: 'no-cache',
          credentials: 'omit',
          mode: 'cors',
          body: formData
        }).then(function (response) {
          self.log('Response: ' + JSON.stringify(response));
          if (response.status === 200) {
            self.log('Success', response);
            self.setResult(true, 'Message Sent!', call);
            self.saveNote(number, channelId, message, filename);
          } else {
            self.error('Failed to send multimedia message ' + response.body);
            self.setResult(false, 'Send Failed!', call);
          }
        });
      },

      getContactId: function() {
        this.log('Calls: ' + JSON.stringify(UiApi.Root.Agent(UiApi.Context.AgentId).Calls(), null, 2));
        if ((UiApi.Root.Agent(UiApi.Context.AgentId).Calls().length > 0) &&
            (UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].state !== 'FINISHED')) {
          if (UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].activeContact) {
            return UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].activeContact.id;
          }
          return undefined;
        }
        return undefined;
      },

      getInteractionId: function() {
        this.log('Calls: ' + JSON.stringify(UiApi.Root.Agent(UiApi.Context.AgentId).Calls(), null, 2));
        if ((UiApi.Root.Agent(UiApi.Context.AgentId).Calls().length > 0) &&
            (UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].state !== 'FINISHED')) {
          return UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].id;
        }
        return undefined;
      },

      saveNote: function(number, channelId, message, filename) {
        var self = this;
        var contactId = this.getContactId();

        if (contactId) {
          var note;
          var payload;
          var url = 'https://' + this.hostInfo.host + '/appsvcs/rs/svc/orgs/' + this.hostInfo.orgId +
              '/contacts/' + contactId + '/note';

          note = 'SMS To: ' + number + ' From: ' + channelId + ' - ' + message;
          if (filename) {
            note += ' - Attachment: ' + filename;
          }
          payload = {note: note};
          this.log('Payload: ' + JSON.stringify(payload));

          fetch(url, {
            method: 'PUT',
            cache: 'no-cache',
            credentials: 'include',
            mode: 'cors',
            headers: {
              'Authorization': 'Bearer-' + this.hostInfo.tokenId,
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
          }).then(function (response) {
            self.log('Response: ' + JSON.stringify(response));
            if (response.status === 200) {
              self.log('Success, note saved', response);
            } else {
              self.error('Failed to save note ' + JSON.stringify(response.body));
              self.setResult(false, 'Failed to save note!');
            }
          });
        } else {
          this.warn('Not on call, cannot save note');
        }
      },

      //************** CAV Code *****************

      setCase: function(str) {
        if (!this.sort.case) {
          return str.toLowerCase();
        }
        return str;
      },

      compare: function(a, b) {
        switch(this.sort.type) {
          case 'alpha':
            if (this.sort.direction === 'desc') {
              return this.setCase(b.description).localeCompare(this.setCase(a.description));
            }
            return this.setCase(a.description).localeCompare(this.setCase(b.description));
          case 'none': return 0;
          case 'number':
            if (this.sort.direction === 'desc') {
              return b.number.localeCompare(a.number);
            }
            return a.number.localeCompare(b.number);
          case 'order':
            if (this.sort.direction === 'desc') {
              return b.order - a.order;
            }
            return a.order - b.order;
          default: return 0;
        }
      },

      sortChannels: function(channels) {
        var self = this;
        if (this.sort.type !== 'none') {
          channels.sort(function (a, b) {
            return self.compare(a, b);
          });
        }
        return channels;
      },

      hasSkill: function(channel, skills) {
        for(var s=0; s<skills.length; s++) {
          if (channel.onlyForSkills.includes(skills.at(s).get('name'))) {
            this.log('Agent has skill: ' + skills.at(s).get('name'));
            return true;
          }
        }
        return false;
      },

      excludeChannel: function(channel, skills) {
        var byAgent = false;
        var bySkill = false;
        var excludedByAgent = false;
        var excludedBySkill = false;

        if (channel.onlyForAgents) {
          byAgent = true;
          if (!channel.onlyForAgents.includes(this.agentInfo.userName)) {
            this.log('Excluded: ' + channel.number + ' Only For Agents: ' + JSON.stringify(channel.onlyForAgents));
            excludedByAgent = true;
          } else {
            this.log('Included: ' + channel.number + ' Only For Agents: ' + JSON.stringify(channel.onlyForAgents));
          }
        }

        if (channel.onlyForSkills) {
          bySkill = true;
          if (!this.hasSkill(channel, skills)) {
            this.log('Excluded: ' + channel.number + ' Only For Skills: ' + JSON.stringify(channel.onlyForSkills));
            excludedBySkill = true;
          } else {
            this.log('Included: ' + channel.number + ' Only For Skills: ' + JSON.stringify(channel.onlyForSkills));
          }
        }

        if (byAgent && bySkill) {
          return excludedByAgent && excludedBySkill;
        }
        if (byAgent) {
          return excludedByAgent;
        }
        if (bySkill) {
          return excludedBySkill;
        }
        return false;
      },

      getChannelIds: function(campaignId) {
        var defaultSet = false;
        var numbers = this._smsNumbers;
        var skills = Five9.Context.Agent.Skills();

        this.log('Skills: ' + JSON.stringify(skills, null, 2));
        if (numbers && numbers.length > 0) {
          var defaultNumber = this.getDefaultNumber(campaignId);
          this.log('defaultNumber: ' + defaultNumber);
          var channels = [];
          for(var c=0; c<numbers.length; c++) {
            var option = _.clone(numbers[c]);
            if (!this.excludeChannel(option, skills)) {
              if (option.number === defaultNumber) {
                option.selected = true;
                defaultSet = true;
              }
              this.log('Adding Option: ' + JSON.stringify(option));
              channels.push(option);
            }
          }
          channels = this.sortChannels(channels);
          if (!defaultSet && channels.length > 0) {
            channels[0].selected = true;
            defaultNumber = channels[0].number;
          }
          if (campaignId) {
            this._channelCall = defaultNumber;
          } else {
            this._channel = defaultNumber;
          }
          return channels;
        }
        this.log('Waiting for channelId loading');
        return [];
      },

      loadNumbers: function() {
        return this.getFive9MetaData();
      },

      getDefaultNumber: function(campaignId) {
        var number;
        var agentNumber;
        var defaultNumber;
        var numbers = this._smsNumbers;

        if (numbers) {
          for (var n = 0; n < numbers.length; n++) {
            if (numbers[n].default) {
              defaultNumber = numbers[n].number;
            }
            if (campaignId && numbers[n].campaignIds && numbers[n].campaignIds.includes(campaignId)) {
              this.log('SMS channel ' + numbers[n].number + ' set for campaignId: ' + campaignId);
              number = numbers[n].number;
            }
            if (numbers[n].agentsDefault && numbers[n].agentsDefault.includes(this.agentInfo.userName)) {
              agentNumber = numbers[n].number;
            }
          }
          if (campaignId) {
            return this._channelCall || agentNumber || number || defaultNumber;
          } else {
            return this._channel || agentNumber || number || defaultNumber;
          }
        }
        return undefined;
      },

      getFive9MetaData: function() {
        var self = this;
        this.log('getFive9MetaData');
        return fetch('https://app.five9.com/appsvcs/rs/svc/auth/metadata', {
          cache: 'no-cache',
          credentials: 'include',
          mode: 'cors'
        })
            .then(function(response) {
              self.log(response.status);
              if (response.status === 200) {
                self.log('response ok');
                return response.json();
              }
              self.log('Agent is not logged in');
              return [];
            })
            .then(jsonData => { return self.getCAVs(jsonData); } )
            .catch((err) => function(err) {
              self.log('Agent is not logged in', err);
              return [];
            });
      },

      safeJSON: function(jsonStr) {
        try {
          return JSON.parse(jsonStr);
        } catch(exception) {
          this.error('safeJSON: Failed to parse: ' + jsonStr + ' Error: ' + exception.message);
        }
        return undefined;
      },

      extractCAVs: function() {
        var channels = [];
        this.apitoken = this.getCAVdefaultValue(this.getCAVbyName('ADT SMS.token'));
        this.smsServer = this.getCAVdefaultValue(this.getCAVbyName('ADT SMS.server'));
        this._multimediaEnabled = this.getCAVdefaultValue(this.getCAVbyName('ADT SMS.multimedia')) === 'true';
        this.sort = this.safeJSON(this.getCAVdefaultValue(this.getCAVbyName('ADT SMS.sort')));
        this.preview = this.safeJSON(this.getCAVdefaultValue(this.getCAVbyName('ADT SMS.preview')));

        if (!this.smsServer) {
          this.warn('SMS Server CAV (ADT SMS.Server) is not defined.  Defaulting.');
          this.smsServer = 'https://app.ps.five9.com/sms-service';
        }

        if (!this.sort) {
          this.log('Defaulting sort');
          this.sort = {type: 'alpha', case: false, direction: 'asc'};
        }

        if (!this.preview) {
          this.log('Defaulting preview');
          this.preview = {height: 55};
        }

        this.log('********** SMS Settings **********');
        this.log('SMS Server: ' + this.smsServer);
        this.log('API Token : ' + this.apitoken);
        this.log('Multimedia: ' + this._multimediaEnabled);
        this.log('Sort      : ' + JSON.stringify(this.sort));
        this.log('Preview   : ' + JSON.stringify(this.preview));

        for (var x=0; x<200; x++) {
          var cav = 'ADT SMS.channel' + x;
          var channelCAV = this.getCAVbyName(cav);
          if (channelCAV) {
            var json = this.safeJSON(this.getCAVdefaultValue(channelCAV));
            if (json) {
              if (!json.disabled) {
                this.log('Adding: ' + JSON.stringify(json));
                channels.push(json);
              } else {
                this.log('Excluding: ' + JSON.stringify(json));
              }
            }
          }
        }
        this._smsNumbers = _.clone(channels);
        this.log('Channels: ' + JSON.stringify(this._smsNumbers, null, 2));
        Five9.vent.trigger('five9SMS:channels:loaded');
        Five9.vent.trigger('pres:model:activity:active');
        return channels;
      },

      getHostInfo: function(response) {
        var host = '';
        var orgId = '';
        var farmId = '';
        var tokenId = '';

        try {
          var metadata = response.metadata;
          if (metadata.dataCenters) {
            var dataCenters = metadata.dataCenters;
            for(var i=0; i < dataCenters.length; i++) {
              var dataCenter = dataCenters[i];
              if (dataCenter.active) {
                var apiUrl = dataCenter.apiUrls[0];
                host = apiUrl.host + ':' + apiUrl.port;
                break;
              }
            }
            orgId = response.orgId;
            tokenId = response.tokenId;
            farmId = response.context.farmId;
            this.log('getHostInfo: host: ' + host + ' farmId: ' + farmId + ' orgId: ' + orgId + ' tokenId: ' + tokenId);
          } else {
            this.error('getHostInfo: datacenters not found: ' + JSON.stringify(metadata, null, 2));
          }
        } catch(exception) {
          this.error('getHostInfo: Failed: Exception: ' + exception.message);
        }
        return {host: host, farmId: farmId, orgId: orgId, tokenId: tokenId};
      },

      getCAVs: function(f9md) {
        this.log('getCAVs');
        var self = this;

        this.hostInfo = this.getHostInfo(f9md);

        return fetch('https://' + this.hostInfo.host + '/appsvcs/rs/svc/orgs/' + this.hostInfo.orgId + '/call_variables', {
          cache: 'no-cache',
          credentials: 'include',
          mode: 'cors'
        })
            .then(response => response.json())
            .then(function(cavs) {
              self.cavs = cavs;
              return self.getAgentInfo();
            }).catch((err) => function(err) {
              self.error(err);
              return [];
            });
      },

      checkDefault: function(restriction) {
        return restriction.type === 'DEFAULT_VALUE';
      },

      getCAVdefaultValue: function(cav) {
        if (cav && cav.restrictions) {
          var restrictions = cav.restrictions.restrictions;
          if (restrictions) {
            var restriction = restrictions.find((restriction) => this.checkDefault(restriction));
            if (restriction) {
              return restriction.value;
            }
          }
        }
        return undefined;
      },

      checkName: function(cav, name) {
        if (name) {
          var parts = name.split('.');
          if (parts.length >= 2) {
            if ((parts[0].toLowerCase() === cav.group.toLowerCase()) &&
                (parts[1].toLowerCase() === cav.name.toLowerCase())) {
              return true;
            }
          }
        }
        return false;
      },

      getCAVbyName: function(name) {
        if (name) {
          return this.cavs.find((cav) => this.checkName(cav, name));
        }
        return undefined;
      },

      getAgentInfo: function() {
        this.log('getAgentInfo');
        var self = this;

        return fetch('https://' + this.hostInfo.host + '/appsvcs/rs/svc/agents/' + UiApi.Context.AgentId, {
          cache: 'no-cache',
          credentials: 'include',
          mode: 'cors'
        })
          .then(response => response.json())
          .then(function(agentInfo) {
            self.agentInfo = agentInfo;
            self.log('agentInfo: ' + JSON.stringify(agentInfo, null, 2));
            return self.extractCAVs();
          }).catch((err) => function(err) {
            self.error(err);
            return [];
          });
      },

      log: function(msg) {
        console.log('five9SMS: ' + msg);
      },

      warn: function(msg) {
        console.warn('five9SMS: ' + msg);
      },

      error: function(msg) {
        console.error('five9SMS: ' + msg);
      }
    });
  });

define('components/3rdPartyComp-li-call-tab/views/view',['five9', 'ui.api.v1'],
    function(Five9, UiApi) {

      var Views = {};
      Views.Layout = UiApi.Framework.Container.extend({
        template: '3rdPartyComp-li-home-tab',
        events: {
          'click #send-sms-btn': 'onSendClicked',
          'keyup #number': 'numberChanged',
          'keyup #message': 'messageChanged',
          'click #message': 'messageClicked',
          'change #channel': 'channelChanged',
          'change #fileInput': 'fileChanged',
          'click #cancelFile': 'cancelFileClicked'
        },

        initialize: function(options) {
          var self = this;
          this.model = UiApi.SharedPresModelRepo.getModel('five9SMS');
          this.listenTo(this.model, 'change', this.render);
          Five9.vent.on('five9SMS:channels:loaded', this.render);
          this.model.fetch();

          this.onCallTab = false;
          this.campaignId = undefined;
          self.model.log('Calls: ' + JSON.stringify(UiApi.Root.Agent(UiApi.Context.AgentId).Calls(), null, 2));
          if (this.onCall()) {
            try {
              this.onCallTab = true;
              this.model.setChannel(undefined, this.onCallTab);
              this.campaignId = UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].campaignId;
              this.model.setNumber(UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].remoteNumber, this.onCallTab);
              this.model.setMessage('', this.onCallTab);
            } catch(exception) {
              console.error(exception.message);
            }
          }

          this.helpers = {
            channelIds:  function () {
              return self.model.getChannelIds(self.campaignId);
            },

            number: function() {
              return self.model.number(self.onCallTab);
            },

            channel: function() {
              return self.model.channel(self.onCallTab);
            },

            message: function() {
              return self.model.message(self.onCallTab);
            },

            sendButtonEnabled: function() {
              return self.model.sendButtonEnabled(self.onCallTab);
            },

            multimediaEnabled: function() {
              return self.model.multimediaEnabled(self.onCallTab);
            },

            fileAttached: function() {
              return self.model.fileCount(self.onCallTab) > 0;
            },

            status: function() {
              return self.model.status(self.onCallTab);
            }
          };
        },

        onCall: function() {
          try {
            if ((UiApi.Root.Agent(UiApi.Context.AgentId).Calls().length > 0) &&
                (UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].state !== 'FINISHED')) {
              return true;
            }
          } catch(exception) {
            console.error(exception.message);
          }
          return false;
        },

        numberChanged: function(event) {
          this.model.setNumber(event.currentTarget.value, this.onCallTab);
        },

        messageChanged: function(event) {
          this.model.setMessage(event.currentTarget.value, this.onCallTab);
        },

        messageClicked: function() {
          if (this.model.status(this.onCallTab) !== 'Ready...') {
            this.model.setResult(false, 'Ready...', this.onCallTab);
          }
        },

        channelChanged: function(event) {
          this.model.setChannel(event.currentTarget.value, this.onCallTab);
        },

        fileChanged: function(event) {
          this.model.setFile(event.currentTarget, this.onCallTab);
          this.model.onFileChange(this.model.files(this.onCallTab));
        },

        cancelFileClicked: function(event) {
          this.model.cancelFile(this.onCallTab);
        },

        onRender: function() {
          this.delegateEvents();
        },

        onAfterRender: function() {
          this.model.createFileUploadControl(this.onCallTab);
          this.model.onFileChange(this.model.files(this.onCallTab));
        },

        onSendClicked: function(e) {
          if (this.model.sendButtonEnabled(this.onCallTab)) {
            this.model.send(this.onCallTab);
          }
        }
      });

      return Views;
    });
define('components/3rdPartyComp-li-call-tab/main',['ui.api.v1', './views/view'],
function(UiApi, Views) {
  var Component = UiApi.Framework.BaseComponent.extend({
    initialize: function(options) {
      return new Views.Layout(options);
    }
  });
  return Component;
});

define('components/3rdPartyComp-li-home-tab/views/view',['five9', 'ui.api.v1'],
  function(Five9, UiApi) {

    var Views = {};
    Views.Layout = UiApi.Framework.Container.extend({
      template: '3rdPartyComp-li-home-tab',
      events: {
        'click #send-sms-btn': 'onSendClicked',
        'keyup #number': 'numberChanged',
        'keyup #message': 'messageChanged',
        'click #message': 'messageClicked',
        'change #channel': 'channelChanged',
        'change #fileInput': 'fileChanged',
        'click #cancelFile': 'cancelFileClicked'
      },

      initialize: function(options) {
        var self = this;
        this.model = UiApi.SharedPresModelRepo.getModel('five9SMS');
        this.listenTo(this.model, 'change', this.render);
        Five9.vent.on('five9SMS:channels:loaded', this.render);
        this.model.fetch();

        this.onCallTab = false;
        this.campaignId = undefined;
        self.model.log('Calls: ' + JSON.stringify(UiApi.Root.Agent(UiApi.Context.AgentId).Calls(), null, 2));
        if (this.onCall()) {
          try {
            this.onCallTab = true;
            this.model.setChannel(undefined, this.onCallTab);
            this.campaignId = UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].campaignId;
            this.model.setNumber(UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].remoteNumber, this.onCallTab);
            this.model.setMessage('', this.onCallTab);
          } catch(exception) {
            console.error(exception.message);
          }
        }

        this.helpers = {
          channelIds:  function () {
            return self.model.getChannelIds(self.campaignId);
          },

          number: function() {
            return self.model.number(self.onCallTab);
          },

          channel: function() {
            return self.model.channel(self.onCallTab);
          },

          message: function() {
            return self.model.message(self.onCallTab);
          },

          sendButtonEnabled: function() {
            return self.model.sendButtonEnabled(self.onCallTab);
          },

          multimediaEnabled: function() {
            return self.model.multimediaEnabled(self.onCallTab);
          },

          fileAttached: function() {
            return self.model.fileCount(self.onCallTab) > 0;
          },

          status: function() {
            return self.model.status(self.onCallTab);
          }
        };
      },

      onCall: function() {
        try {
          if ((UiApi.Root.Agent(UiApi.Context.AgentId).Calls().length > 0) &&
              (UiApi.Root.Agent(UiApi.Context.AgentId).Calls().jsonCollection[0].state !== 'FINISHED')) {
            return true;
          }
        } catch(exception) {
          console.error(exception.message);
        }
        return false;
      },

      numberChanged: function(event) {
        this.model.setNumber(event.currentTarget.value, this.onCallTab);
      },

      messageChanged: function(event) {
        this.model.setMessage(event.currentTarget.value, this.onCallTab);
      },

      messageClicked: function() {
        if (this.model.status(this.onCallTab) !== 'Ready...') {
          this.model.setResult(false, 'Ready...', this.onCallTab);
        }
      },

      channelChanged: function(event) {
        this.model.setChannel(event.currentTarget.value, this.onCallTab);
      },

      fileChanged: function(event) {
        this.model.setFile(event.currentTarget, this.onCallTab);
        this.model.onFileChange(this.model.files(this.onCallTab));
      },

      cancelFileClicked: function(event) {
        this.model.cancelFile(this.onCallTab);
      },

      onRender: function() {
        this.delegateEvents();
      },

      onAfterRender: function() {
        this.model.createFileUploadControl(this.onCallTab);
        this.model.onFileChange(this.model.files(this.onCallTab));
      },

      onSendClicked: function(e) {
        if (this.model.sendButtonEnabled(this.onCallTab)) {
          this.model.send(this.onCallTab);
        }
      }
    });

    return Views;
  });
define('components/3rdPartyComp-li-home-tab/main',['ui.api.v1', './views/view'],
function(UiApi, Views) {
  var Component = UiApi.Framework.BaseComponent.extend({
    initialize: function(options) {
      return new Views.Layout(options);
    }
  });
  return Component;
});

define('3rdparty.bundle',[
    'ui.api.v1',
    'handlebars',
    'workflow/init'

    //presentations models
    ,'presentation.models/five9SMS'

    //components
    ,'components/3rdPartyComp-li-call-tab/main'
    ,'components/3rdPartyComp-li-home-tab/main'

  ],
  function (UiApi, Handlebars, Init
            ,Constructor0
      ) {

this["JST"] = this["JST"] || {};

this["JST"]["3rdPartyComp-li-call-tab"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "                <option value=\""
    + alias2(alias1((depth0 != null ? depth0.number : depth0), depth0))
    + "\" "
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.selected : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">"
    + alias2(alias1((depth0 != null ? depth0.description : depth0), depth0))
    + "</option>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "selected=\"selected\"";
},"4":function(container,depth0,helpers,partials,data) {
    return "class=\"smsButton\"";
},"6":function(container,depth0,helpers,partials,data) {
    return "class=\"smsButtonDisabled\"";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "            <input class=\"smsButton\" id=\"fileInputButton \" type=\"button\" value=\"Attach\" title=\"Attach image\" onclick=\"document.getElementById('fileInput').click();\">\n            <button "
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.fileAttached : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + " id=\"cancelFile\" style=\"font-size:13px;color:red\" title=\"Remove Image\">X</button>\n";
},"9":function(container,depth0,helpers,partials,data) {
    return "class=\"smsCancelButton\"";
},"11":function(container,depth0,helpers,partials,data) {
    return "            <div>\n                <input type=\"file\" id=\"fileInput\" name=\"fileInput\" style=\"display: none;\" accept=\".gif,.png,.jpg,.jpeg\">\n                <span id=\"fileStatusInfo\" class=\"fileStatusInfo\"></span>\n            </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"third-party-styles\">\n    <div class=\"form-group\">\n        <select id=\"channel\" class=\"form-control\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.channelIds : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </select>\n\n        <input class=\"number\" type=\"text\" name=\"number\" id=\"number\" value=\""
    + alias4(((helper = (helper = helpers.number || (depth0 != null ? depth0.number : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"number","hash":{},"data":data}) : helper)))
    + "\" placeholder=\"Recipient phone number...\">\n        <textarea class=\"message\" id=\"message\"\n                  name=\"message\" rows=\"4\" wrap=\"hard\"\n                  placeholder=\"Type here to compose a message...\">"
    + alias4(((helper = (helper = helpers.message || (depth0 != null ? depth0.message : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"message","hash":{},"data":data}) : helper)))
    + "</textarea>\n        <button "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.sendButtonEnabled : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + " id=\"send-sms-btn\" title=\"Send message\">Send</button>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.multimediaEnabled : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        <label id=\"sms-status\">"
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "</label>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.multimediaEnabled : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    </div>\n</div>\n\n";
},"useData":true});

this["JST"]["3rdPartyComp-li-home-tab"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "                <option value=\""
    + alias2(alias1((depth0 != null ? depth0.number : depth0), depth0))
    + "\" "
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.selected : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">"
    + alias2(alias1((depth0 != null ? depth0.description : depth0), depth0))
    + "</option>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "selected=\"selected\"";
},"4":function(container,depth0,helpers,partials,data) {
    return "class=\"smsButton\"";
},"6":function(container,depth0,helpers,partials,data) {
    return "class=\"smsButtonDisabled\"";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "            <input class=\"smsButton\" id=\"fileInputButton \" type=\"button\" value=\"Attach\" title=\"Attach image\" onclick=\"document.getElementById('fileInput').click();\">\n            <button "
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.fileAttached : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + " id=\"cancelFile\" style=\"font-size:13px;color:red\" title=\"Remove Image\">X</button>\n";
},"9":function(container,depth0,helpers,partials,data) {
    return "class=\"smsCancelButton\"";
},"11":function(container,depth0,helpers,partials,data) {
    return "        <div>\n            <input type=\"file\" id=\"fileInput\" name=\"fileInput\" style=\"display: none;\" accept=\".gif,.png,.jpg,.jpeg\">\n            <span id=\"fileStatusInfo\" class=\"fileStatusInfo\"></span>\n        </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"third-party-styles\">\n    <div class=\"form-group\">\n        <select id=\"channel\" class=\"form-control\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.channelIds : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </select>\n\n        <input class=\"number\" type=\"text\" name=\"number\" id=\"number\" value=\""
    + alias4(((helper = (helper = helpers.number || (depth0 != null ? depth0.number : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"number","hash":{},"data":data}) : helper)))
    + "\" placeholder=\"Recipient phone number...\">\n        <textarea class=\"message\" id=\"message\"\n                  name=\"message\" rows=\"4\" wrap=\"hard\"\n                  placeholder=\"Type here to compose a message...\">"
    + alias4(((helper = (helper = helpers.message || (depth0 != null ? depth0.message : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"message","hash":{},"data":data}) : helper)))
    + "</textarea>\n        <button "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.sendButtonEnabled : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + " id=\"send-sms-btn\" title=\"Send message\">Send</button>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.multimediaEnabled : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        <label id=\"sms-status\">"
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "</label>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.multimediaEnabled : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    </div>\n</div>\n";
},"useData":true});

    require.config({
      map: {
        '*': {
        }
      }
    });

    UiApi.Logger.info('Registering 3rdparty presentation model with name five9SMS');
    UiApi.SharedPresModelRepo.registerConstructor('five9SMS', Constructor0);

    Init.initialize();
    UiApi.vent.on(UiApi.PresModelEvents.WfMainOnModelLoad, function() {
      Init.onModelLoad();
    });
    UiApi.vent.on(UiApi.PresModelEvents.WfMainOnModelUnload, function() {
      Init.onModelUnload();
    });
  });
